import copy
import random

import numpy as np
import torch
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor
from torch import nn

SEED = 42
MODEL_NAMES = ("naive", "drift", "sma", "linear_regression", "svr", "rbf", "tree", "lstm")


def seed():
    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)
    torch.set_num_threads(2)
    torch.use_deterministic_algorithms(True)


def pipeline(name, parameter):
    model = {"linear_regression": lambda: Ridge(alpha=parameter),
             "svr": lambda: SVR(kernel="linear", C=1, epsilon=.001),
             "rbf": lambda: SVR(kernel="rbf", C=1, epsilon=.001),
             "tree": lambda: DecisionTreeRegressor(max_depth=parameter, random_state=SEED)}[name]()
    return make_pipeline(StandardScaler(), model)


class ReturnLSTM(nn.Module):
    def __init__(self, features):
        super().__init__()
        self.lstm = nn.LSTM(features, 32, num_layers=1, batch_first=True)
        self.output = nn.Linear(32, 1)

    def forward(self, x):
        values, _ = self.lstm(x)
        return self.output(values[:, -1]).squeeze(-1)


def sequences(x, positions, length=30):
    if min(positions) < length - 1:
        raise ValueError("Sequence has insufficient historical context")
    return np.stack([x[i-length+1:i+1] for i in positions])


def fit_lstm(x, y, train, valid=None, epochs=60):
    seed()
    scaler = StandardScaler().fit(x[train])
    scaled = scaler.transform(x)
    model = ReturnLSTM(x.shape[1])
    optimizer = torch.optim.Adam(model.parameters(), lr=.001)
    inputs = torch.tensor(sequences(scaled, train), dtype=torch.float32)
    targets = torch.tensor(y[train], dtype=torch.float32)
    validation = torch.tensor(sequences(scaled, valid), dtype=torch.float32) if valid is not None else None
    best_loss, best_epoch, waiting, best_state = float("inf"), 1, 0, None
    for epoch in range(epochs):
        model.train()
        for start in range(0, len(inputs), 64):
            optimizer.zero_grad()
            loss = nn.functional.mse_loss(model(inputs[start:start+64]), targets[start:start+64])
            loss.backward()
            optimizer.step()
        if validation is not None:
            model.eval()
            with torch.no_grad():
                loss = float(nn.functional.l1_loss(model(validation), torch.tensor(y[valid], dtype=torch.float32)))
            if loss < best_loss:
                best_loss, best_epoch, waiting = loss, epoch+1, 0
                best_state = copy.deepcopy(model.state_dict())
            else:
                waiting += 1
                if waiting >= 6:
                    break
    if best_state is not None:
        model.load_state_dict(best_state)
    return model, scaler, best_epoch if valid is not None else epochs


def predict_lstm(model, scaler, x, positions):
    model.eval()
    with torch.no_grad():
        inputs = torch.tensor(sequences(scaler.transform(x), positions), dtype=torch.float32)
        return model(inputs).numpy().astype(float)
