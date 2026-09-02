import yfinance as yf
import pandas as pd
import numpy as np
import time
from typing import List, Dict, Any, Optional

# In-memory TTL cache
_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 60

class StockService:
    def get_historical_data(self, ticker: str, period: str = "180d") -> List[Dict[str, Any]]:
        """Downloads historical OHLCV data with in-memory caching."""
        cache_key = f"{ticker.upper()}_{period}"
        now = time.time()
        
        if cache_key in _CACHE:
            entry = _CACHE[cache_key]
            if now - entry["timestamp"] < CACHE_TTL_SECONDS:
                return entry["data"]

        data = yf.download(tickers=ticker, period=period, interval='1d', auto_adjust=False, progress=False)
        if data is None or data.empty:
            return []
            
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.droplevel(1)
            
        data.dropna(inplace=True)
        if data.empty:
            return []

        # Convert volume to millions
        if 'Volume' in data.columns:
            data['Volume'] = data['Volume'] / 1_000_000

        records = []
        for index, row in data.iterrows():
            date_str = index.strftime('%Y-%m-%d') if hasattr(index, 'strftime') else str(index)
            records.append({
                "date": date_str,
                "open": round(float(row.get('Open', 0)), 2),
                "high": round(float(row.get('High', 0)), 2),
                "low": round(float(row.get('Low', 0)), 2),
                "close": round(float(row.get('Close', 0)), 2),
                "adjClose": round(float(row.get('Adj Close', row.get('Close', 0))), 2),
                "volume": round(float(row.get('Volume', 0)), 4),
                "ma": None,
                "ema": None,
                "rsi": None,
                "macd": None,
                "macdSignal": None,
                "macdHist": None,
                "bbUpper": None,
                "bbLower": None,
                "bbMiddle": None
            })

        _CACHE[cache_key] = {"timestamp": now, "data": records}
        return records

    def get_with_technical_indicators(self, ticker: str, ma_days: int = 50, period: str = "180d") -> List[Dict[str, Any]]:
        """Calculates SMA, EMA, RSI(14), MACD(12,26,9), and Bollinger Bands."""
        records = [dict(r) for r in self.get_historical_data(ticker, period=period)]
        if not records or len(records) < 5:
            return records

        closes = pd.Series([r["close"] for r in records])

        # 1. Simple Moving Average (SMA)
        sma = closes.rolling(window=ma_days).mean()

        # 2. Exponential Moving Average (EMA 20)
        ema = closes.ewm(span=20, adjust=False).mean()

        # 3. Relative Strength Index (RSI 14)
        delta = closes.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / (loss + 1e-9)
        rsi = 100 - (100 / (1 + rs))

        # 4. MACD (12, 26, 9)
        ema12 = closes.ewm(span=12, adjust=False).mean()
        ema26 = closes.ewm(span=26, adjust=False).mean()
        macd = ema12 - ema26
        signal = macd.ewm(span=9, adjust=False).mean()
        hist = macd - signal

        # 5. Bollinger Bands (20, 2)
        bb_mid = closes.rolling(window=20).mean()
        bb_std = closes.rolling(window=20).std()
        bb_upper = bb_mid + (bb_std * 2)
        bb_lower = bb_mid - (bb_std * 2)

        for i in range(len(records)):
            records[i]["ma"] = round(float(sma[i]), 2) if not np.isnan(sma[i]) else None
            records[i]["ema"] = round(float(ema[i]), 2) if not np.isnan(ema[i]) else None
            records[i]["rsi"] = round(float(rsi[i]), 2) if not np.isnan(rsi[i]) else None
            records[i]["macd"] = round(float(macd[i]), 2) if not np.isnan(macd[i]) else None
            records[i]["macdSignal"] = round(float(signal[i]), 2) if not np.isnan(signal[i]) else None
            records[i]["macdHist"] = round(float(hist[i]), 2) if not np.isnan(hist[i]) else None
            records[i]["bbUpper"] = round(float(bb_upper[i]), 2) if not np.isnan(bb_upper[i]) else None
            records[i]["bbLower"] = round(float(bb_lower[i]), 2) if not np.isnan(bb_lower[i]) else None
            records[i]["bbMiddle"] = round(float(bb_mid[i]), 2) if not np.isnan(bb_mid[i]) else None

        return records

    def get_with_moving_average(self, ticker: str, days: int = 50, period: str = "180d") -> List[Dict[str, Any]]:
        """Legacy compatibility wrapper that includes full indicators."""
        return self.get_with_technical_indicators(ticker, ma_days=days, period=period)
