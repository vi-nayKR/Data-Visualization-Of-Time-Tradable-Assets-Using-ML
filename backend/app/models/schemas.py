from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class CompanyItem(BaseModel):
    name: str
    ticker: str

class OHLCVRecord(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    adjClose: float
    volume: float
    ma: Optional[float] = None

