import numpy as np

from app.ml.features import dataset, features, folds
from app.ml.metrics import metrics, return_to_price
from app.ml.models import MODEL_NAMES, fit_lstm, pipeline, predict_lstm, seed


def baseline(name, frame, train, positions):
    if name == "naive":
        return np.zeros(len(positions))
    if name == "drift":
        return np.full(len(positions), frame.iloc[train].target.mean())
    return np.log(frame.iloc[positions].sma20 / frame.iloc[positions].close).to_numpy()


def evaluate(bars, horizon):
    seed()
    frame, columns, train, test = dataset(bars, horizon)
    x, y = frame[columns].to_numpy(), frame.target.to_numpy()
    # LSTM context ends at t and never contains t+1 or later.
    train = train[train >= 29]
    splits = list(folds(train, horizon))
    naive_mae = float(np.mean(np.abs(y[test])))
    latest = features(bars).dropna()
    latest_frame = latest.assign(close=bars.Close, sma20=bars.Close.rolling(20).mean())
    latest_x = latest[columns].to_numpy()
    close = float(bars.Close.iloc[-1])
    output = []
    for name in MODEL_NAMES:
        parameters = [0.1, 1., 10., 100.] if name == "linear_regression" else [2, 4, 6] if name == "tree" else [None]
        candidates = []
        for parameter in parameters:
            errors, residuals, epochs = [], [], []
            for fit, valid in splits:
                if name in ("naive", "drift", "sma"):
                    predicted = baseline(name, frame, fit, valid)
                elif name == "lstm":
                    model, scaler, best_epoch = fit_lstm(x, y, fit, valid)
                    predicted = predict_lstm(model, scaler, x, valid)
                    epochs.append(best_epoch)
                else:
                    model = pipeline(name, parameter).fit(x[fit], y[fit])
                    predicted = model.predict(x[valid])
                errors.append(float(np.mean(np.abs(y[valid]-predicted))))
                residuals.extend((y[valid]-predicted).tolist())
            candidates.append((float(np.mean(errors)), parameter, residuals, epochs, errors))
        validation_mae, parameter, residuals, epochs, fold_mae = min(candidates, key=lambda item: item[0])
        # The hold-out is read only after all choices for this model are frozen.
        if name in ("naive", "drift", "sma"):
            predicted = baseline(name, frame, train, test)
            forecast_return = 0. if name == "naive" else float(y[train].mean()) if name == "drift" else float(np.log(latest_frame.sma20.iloc[-1]/close))
        elif name == "lstm":
            model, scaler, _ = fit_lstm(x, y, train, epochs=int(np.median(epochs)))
            predicted = predict_lstm(model, scaler, x, test)
            forecast_return = float(predict_lstm(model, scaler, latest_x, [len(latest_x)-1])[0])
        else:
            model = pipeline(name, parameter).fit(x[train], y[train])
            predicted = model.predict(x[test])
            forecast_return = float(model.predict(latest_x[-1:])[0])
        low, high = np.quantile(residuals, [.1, .9])
        output.append({"name": name, "validation_mae": validation_mae, "fold_mae": fold_mae,
                       "parameter": parameter, "epochs": int(np.median(epochs)) if epochs else None,
                       "metrics": metrics(y[test], predicted, frame.close.to_numpy()[test], naive_mae),
                       "forecast": {"price": float(return_to_price(close, forecast_return)),
                                    "return": forecast_return, "lower": float(return_to_price(close, forecast_return+low)),
                                    "upper": float(return_to_price(close, forecast_return+high)),
                                    "residual_quantiles": [float(low), float(high)],
                                    "horizon": horizon, "origin_price": close}})
    # Winner is selected ONLY using validation, including the three baselines.
    winner = min(output, key=lambda item: item["validation_mae"])["name"]
    beats_naive = any((m["metrics"]["skill_vs_naive"] or 0) > 0 for m in output if m["name"] not in ("naive", "drift", "sma"))
    return {"models": sorted(output, key=lambda item: item["validation_mae"]), "winner": winner,
            "beats_naive": beats_naive,
            "message": "At least one model beats the naive baseline on held-out data" if beats_naive else "No model beats the naive baseline on held-out data",
            "evaluation": {"target": "forward log return", "horizon": horizon, "holdout_observations": len(test),
                           "holdout_start": str(frame.index[test[0]].date()), "holdout_end": str(frame.index[test[-1]].date()),
                           "validation_folds": 5, "validation_block": 40, "gap": horizon}}
