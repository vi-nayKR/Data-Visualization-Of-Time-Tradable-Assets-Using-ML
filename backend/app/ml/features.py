import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit


def features(bars):
    close = bars["Close"]
    returns = np.log(close / close.shift(1))
    result = pd.DataFrame(index=bars.index)
    for lag in (1, 2, 3, 5, 10):
        result[f"return_{lag}"] = np.log(close / close.shift(lag))
    for window in (5, 20):
        result[f"volatility_{window}"] = returns.rolling(window).std()
    for window in (10, 20, 50):
        result[f"sma_{window}"] = close / close.rolling(window).mean() - 1
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    result["rsi"] = (100 - 100 / (1 + gain / loss.replace(0, np.nan))).where(loss != 0, 100).where((gain + loss) != 0, 50)
    volume = bars["Volume"]
    std = volume.rolling(20).std()
    result["volume_z"] = ((volume - volume.rolling(20).mean()) / std.replace(0, np.nan)).where(std != 0, 0)
    return result.replace([np.inf, -np.inf], np.nan)


def dataset(bars, horizon):
    if horizon not in (1, 5):
        raise ValueError("horizon must be 1 or 5 trading days")
    x = features(bars)
    target = np.log(bars["Close"].shift(-horizon) / bars["Close"])
    frame = x.assign(target=target, close=bars["Close"], sma20=bars["Close"].rolling(20).mean()).dropna()
    # Partition by original trading-bar position, not by a shuffled sample.
    positions = bars.index.get_indexer(frame.index)
    test_start = len(bars) - horizon - 60
    train = np.flatnonzero(positions < test_start - horizon)
    test = np.flatnonzero(positions >= test_start)
    if len(test) != 60 or len(train) < 250:
        raise ValueError("Need enough daily bars for five 40-day validation folds and 60 hold-out observations")
    return frame, list(x.columns), train, test


def folds(train_indices, horizon):
    splitter = TimeSeriesSplit(n_splits=5, test_size=40, gap=horizon)
    for train, valid in splitter.split(train_indices):
        yield train_indices[train], train_indices[valid]
