import yfinance as yf
import pandas as pd
from typing import List, Dict, Any, Optional

class StockService:
    def get_historical_data(self, ticker: str, period: str = "180d") -> List[Dict[str, Any]]:
        """Downloads historical OHLCV data from Yahoo Finance."""
        data = yf.download(tickers=ticker, period=period, interval='1d', auto_adjust=False)
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
                "ma": None
            })
        return records

    def get_with_moving_average(self, ticker: str, days: int = 50, period: str = "180d") -> List[Dict[str, Any]]:
        """Calculates moving average for specified days."""
        records = self.get_historical_data(ticker, period=period)
        if not records:
            return []

        closes = [r["close"] for r in records]
        for i in range(len(records)):
            if i >= days - 1:
                ma_val = sum(closes[i - days + 1:i + 1]) / days
                records[i]["ma"] = round(ma_val, 2)
            else:
                records[i]["ma"] = None
        return records
