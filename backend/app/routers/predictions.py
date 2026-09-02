from fastapi import APIRouter, Query, HTTPException
from app.services.prediction_service import PredictionService

router = APIRouter()
prediction_service = PredictionService()

@router.get("/{ticker}/predict")
async def predict(ticker: str, model: str = Query("linear_regression")):
    res = prediction_service.run_prediction(ticker, model_type=model)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@router.get("/{ticker}/best-model")
async def best_model(ticker: str):
    res = prediction_service.find_best_model(ticker)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res
