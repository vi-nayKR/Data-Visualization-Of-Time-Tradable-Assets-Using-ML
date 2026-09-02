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

class PredictionResponse(BaseModel):
    ticker: str
    model: str
    confidence: float
    records: List[Dict[str, Any]]
    predictions: List[Optional[float]]

class ModelScore(BaseModel):
    name: str
    score: float

class BestModelResponse(BaseModel):
    ticker: str
    winner: str
    winnerScore: float
    models: List[ModelScore]
    records: List[Dict[str, Any]]
    predictions: List[Optional[float]]
