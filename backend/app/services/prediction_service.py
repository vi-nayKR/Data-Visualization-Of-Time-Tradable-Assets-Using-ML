import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from app.services.stock_service import StockService
from app.models.lstm_model import PyTorchLSTM, HAS_LSTM
import torch
import torch.nn as nn
import torch.optim as optim

class PredictionService:
    def __init__(self):
        self.stock_service = StockService()

    def _prepare_dataset(self, ticker: str, future_days: int = 50):
        records = self.stock_service.get_historical_data(ticker, period="200d")
        if not records or len(records) <= future_days:
            return None

        closes = np.array([r["close"] for r in records]).reshape(-1, 1)
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_close = scaler.fit_transform(closes)

        df = pd.DataFrame({"Close": scaled_close.flatten()})
        df["Prediction"] = df[["Close"]].shift(-future_days)

        x = np.array(df.drop(["Prediction"], axis=1))[:-future_days]
        y = np.array(df["Prediction"])[:-future_days]

        valid_mask = ~np.isnan(y)
        x = x[valid_mask]
        y = y[valid_mask]

        x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.25, random_state=42)

        x_future = np.array(df.drop(["Prediction"], axis=1))[:-future_days][-future_days:]

        return {
            "x_train": x_train, "x_test": x_test,
            "y_train": y_train, "y_test": y_test,
            "x_future": x_future, "scaler": scaler,
            "records": records, "scaled_close": scaled_close,
            "df": df, "future_days": future_days
        }

    def run_prediction(self, ticker: str, model_type: str) -> Dict[str, Any]:
        data = self._prepare_dataset(ticker)
        if not data:
            return {"error": "Insufficient data"}

        scaler = data["scaler"]
        records = data["records"]
        x_train, x_test = data["x_train"], data["x_test"]
        y_train, y_test = data["y_train"], data["y_test"]
        x_future = data["x_future"]

        confidence = 0.0
        raw_predictions = []

        if model_type in ["linear_regression", "Linear Regression"]:
            model = LinearRegression().fit(x_train, y_train)
            confidence = model.score(x_test, y_test)
            raw_predictions = model.predict(x_future)
            model_name = "Linear Regression"

        elif model_type in ["tree", "decision_tree", "Tree Prediction"]:
            model = DecisionTreeRegressor().fit(x_train, y_train)
            confidence = model.score(x_test, y_test)
            raw_predictions = model.predict(x_future)
            model_name = "Decision Tree"

        elif model_type in ["svr", "SVR Prediction"]:
            model = SVR(C=1e3, gamma=0.1).fit(x_train, y_train)
            confidence = model.score(x_test, y_test)
            raw_predictions = model.predict(x_future)
            model_name = "SVR Prediction"

        elif model_type in ["rbf", "RBF Prediction"]:
            model = SVR(kernel='rbf', C=1000.0, gamma=0.85).fit(x_train, y_train)
            confidence = model.score(x_test, y_test)
            raw_predictions = model.predict(x_future)
            model_name = "RBF Prediction"

        elif model_type in ["lstm", "LSTM"]:
            model_name = "LSTM Neural Network"
            if HAS_LSTM and PyTorchLSTM is not None:
                res = self._train_lstm(data["scaled_close"], scaler)
                confidence = res["confidence"]
                raw_predictions = res["predictions"]
            else:
                confidence = -999.0
                raw_predictions = []
        else:
            model = LinearRegression().fit(x_train, y_train)
            confidence = model.score(x_test, y_test)
            raw_predictions = model.predict(x_future)
            model_name = "Linear Regression"

        # Rescale predictions to original stock price values
        final_preds = [None] * len(records)
        if len(raw_predictions) > 0:
            preds_unscaled = scaler.inverse_transform(np.array(raw_predictions).reshape(-1, 1)).flatten()
            start_idx = max(0, len(records) - len(preds_unscaled))
            for idx, val in enumerate(preds_unscaled):
                if start_idx + idx < len(final_preds):
                    final_preds[start_idx + idx] = round(float(val), 2)

        return {
            "ticker": ticker,
            "model": model_name,
            "confidence": round(float(confidence), 4),
            "records": records,
            "predictions": final_preds
        }

    def _train_lstm(self, scaled_data: np.ndarray, scaler: MinMaxScaler) -> Dict[str, Any]:
        data = scaled_data.reshape(-1, 1)
        train_size = int(len(data) * 0.75)
        train_data = data[:train_size]
        test_data = data[train_size:]
        n_days = 40

        if len(train_data) <= n_days or len(test_data) <= n_days:
            return {"confidence": 0.0, "predictions": []}

        X_train, y_train = [], []
        for i in range(n_days, len(train_data)):
            X_train.append(train_data[i - n_days:i, 0])
            y_train.append(train_data[i, 0])
        X_train, y_train = np.array(X_train), np.array(y_train)
        X_train = np.reshape(X_train, (X_train.shape[0], X_train.shape[1], 1))

        inputs = data[len(data) - len(test_data) - n_days:]
        X_test = []
        for i in range(n_days, len(inputs)):
            X_test.append(inputs[i - n_days:i, 0])
        X_test = np.array(X_test)
        X_test = np.reshape(X_test, (X_test.shape[0], X_test.shape[1], 1))

        X_train_t = torch.FloatTensor(X_train)
        y_train_t = torch.FloatTensor(y_train).unsqueeze(1)
        X_test_t = torch.FloatTensor(X_test)
        test_data_t = torch.FloatTensor(test_data)

        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = PyTorchLSTM().to(device)
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)

        dataset = torch.utils.data.TensorDataset(X_train_t, y_train_t)
        loader = torch.utils.data.DataLoader(dataset, batch_size=32, shuffle=True)

        model.train()
        for epoch in range(10):
            for batch_x, batch_y in loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                optimizer.zero_grad()
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()

        model.eval()
        with torch.no_grad():
            predictions_t = model(X_test_t.to(device))
            from sklearn.metrics import r2_score
            score = r2_score(test_data_t.cpu().numpy(), predictions_t.cpu().numpy())
            preds = predictions_t.cpu().numpy().flatten()

        return {"confidence": score, "predictions": preds}

    def find_best_model(self, ticker: str) -> Dict[str, Any]:
        models_to_test = ["linear_regression", "tree", "svr", "rbf", "lstm"]
        results = []

        best_res = None
        best_score = -999.0

        for m in models_to_test:
            res = self.run_prediction(ticker, m)
            score = res.get("confidence", -999.0)
            model_name = res.get("model", m)
            results.append({"name": model_name, "score": score})

            if score > best_score:
                best_score = score
                best_res = res

        if not best_res:
            best_res = self.run_prediction(ticker, "linear_regression")

        return {
            "ticker": ticker,
            "winner": best_res["model"],
            "winnerScore": round(float(best_score), 4),
            "models": results,
            "records": best_res["records"],
            "predictions": best_res["predictions"]
        }
