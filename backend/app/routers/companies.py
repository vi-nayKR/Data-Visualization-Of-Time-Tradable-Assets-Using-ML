from typing import Literal
import yfinance as yf
from fastapi import APIRouter, Request, HTTPException
from app.services.company_service import CompanyService

router = APIRouter()

@router.get("/")
async def list_companies(request: Request, market: Literal["in", "us"] = "us"):
    company_service: CompanyService = request.app.state.company_service
    return company_service.get_all_companies(market)

@router.get("/{ticker}/info")
async def company_info(ticker: str):
    try:
        t = yf.Ticker(ticker)
        
        # Safely convert dataframes to dict records
        def safe_dict(df):
            if df is None:
                return []
            try:
                if hasattr(df, 'to_dict'):
                    df_reset = df.reset_index()
                    return df_reset.to_dict(orient='records')
            except Exception:
                pass
            return []

        info_data = {
            "ticker": ticker,
            "isin": str(getattr(t, 'isin', 'N/A')),
            "sustainability": safe_dict(getattr(t, 'sustainability', None)),
            "majorHolders": safe_dict(getattr(t, 'major_holders', None)),
            "institutionalHolders": safe_dict(getattr(t, 'institutional_holders', None)),
            "calendar": safe_dict(getattr(t, 'calendar', None)),
            "recommendations": safe_dict(getattr(t, 'recommendations', None))
        }
        return info_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
