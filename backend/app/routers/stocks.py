from fastapi import APIRouter, Query, HTTPException
from app.services.stock_service import StockService

router = APIRouter()
stock_service = StockService()

@router.get("/{ticker}/ohlcv")
async def get_ohlcv(ticker: str, period: str = Query("180d")):
    data = stock_service.get_historical_data(ticker, period=period)
    if not data:
        raise HTTPException(status_code=444, detail="No stock data found")
    return data

@router.get("/{ticker}/moving-average")
async def get_moving_average(ticker: str, days: int = Query(50), period: str = Query("180d")):
    data = stock_service.get_with_moving_average(ticker, days=days, period=period)
    if not data:
        raise HTTPException(status_code=444, detail="No stock data found")
    return data
