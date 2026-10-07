import numpy as np


def return_to_price(close, predicted_return):
    return np.asarray(close) * np.exp(predicted_return)


def directional_interval(hits, total):
    """95% Wilson binomial interval, including all-success/all-failure samples."""
    if total <= 0:
        raise ValueError("At least one observation is required")
    z = 1.959963984540054
    p = hits / total
    denominator = 1 + z*z / total
    midpoint = (p + z*z / (2*total)) / denominator
    radius = z * np.sqrt(p*(1-p)/total + z*z/(4*total*total)) / denominator
    return [float(midpoint-radius), float(midpoint+radius)]


def metrics(actual, predicted, close, naive_mae):
    actual, predicted, close = map(np.asarray, (actual, predicted, close))
    if not len(actual) or actual.shape != predicted.shape or actual.shape != close.shape:
        raise ValueError("Metrics require equal nonempty arrays")
    true_price = return_to_price(close, actual)
    predicted_price = return_to_price(close, predicted)
    mae = float(np.mean(np.abs(actual-predicted)))
    hits = int(np.sum(np.sign(actual) == np.sign(predicted)))
    return {"mae_return": mae, "rmse_return": float(np.sqrt(np.mean((actual-predicted)**2))),
            "mae_price": float(np.mean(np.abs(true_price-predicted_price))),
            "mape_price": float(np.mean(np.abs((true_price-predicted_price)/true_price))),
            "directional_accuracy": hits/len(actual),
            "directional_accuracy_ci": directional_interval(hits, len(actual)),
            "skill_vs_naive": float(1-mae/naive_mae) if naive_mae > 0 else None,
            "observations": len(actual)}
