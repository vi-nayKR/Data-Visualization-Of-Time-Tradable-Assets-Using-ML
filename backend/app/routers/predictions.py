from fastapi import APIRouter, Query, HTTPException
from app.services.prediction_service import PredictionService

router = APIRouter()
prediction_service = PredictionService()

def serve(function, *args):
    try:
        return function(*args)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="not trained yet")
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

@router.get("/{ticker}/predict")
def predict(ticker: str, model: str = Query("linear_regression"), horizon: int = Query(5, description="1 or 5 trading days")):
    return serve(prediction_service.run_prediction, ticker, model, horizon)

@router.get("/{ticker}/best-model")
def best_model(ticker: str, horizon: int = Query(5, description="1 or 5 trading days")):
    return serve(prediction_service.find_best_model, ticker, horizon)
