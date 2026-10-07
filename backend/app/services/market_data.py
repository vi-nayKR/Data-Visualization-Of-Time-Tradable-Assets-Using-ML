"""Daily bars cached on disk; training is the only three-year downloader."""
import os
import re
import tempfile
import time
from pathlib import Path

import pandas as pd
import yfinance as yf

RAW_DIR = Path(os.getenv("STOCK_RAW_DIR", "/var/cache/stock-api/raw"))


def symbol_path(symbol, root=RAW_DIR):
    if not re.fullmatch(r"[A-Z0-9.^&-]{1,40}", symbol):
        raise ValueError("Invalid market symbol")
    return root / f"{symbol}.csv"


def download(symbol):
    target = symbol_path(symbol)
    error = None
    for attempt in range(2):
        try:
            bars = yf.Ticker(symbol).history(period="3y", interval="1d", auto_adjust=False)
            if bars.empty:
                raise ValueError(f"No daily bars for {symbol}")
            bars.index = pd.to_datetime(bars.index.date)
            bars = bars.loc[~bars.index.duplicated()].sort_index()
            bars = bars.dropna(subset=["Open", "High", "Low", "Close", "Volume"])
            if bars.empty or (bars["Close"] <= 0).any():
                raise ValueError(f"Invalid price history for {symbol}")
            target.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(mode="w", dir=target.parent, delete=False) as tmp:
                temporary = Path(tmp.name)
                bars.to_csv(tmp, index_label="Date")
            try:
                os.replace(temporary, target)
            finally:
                temporary.unlink(missing_ok=True)
            return bars
        except Exception as exc:
            error = exc
            if attempt == 0:
                time.sleep(1)
    raise RuntimeError(f"Download failed for {symbol}: {error}") from error


def cached(symbol):
    return pd.read_csv(symbol_path(symbol), index_col="Date", parse_dates=True)
