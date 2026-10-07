"""Offline regression check: cached and uncached predictions must agree."""
from pathlib import Path
import sys
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from app.services.prediction_service import PredictionService, PRED_CACHE_TTL
from app.core.cache import prediction_cache
import torch

service = PredictionService()
records = [{"date": str(i), "close": float(100 + i / 5 + np.sin(i))} for i in range(200)]
service.stock_service.get_historical_data = lambda *args, **kwargs: records
assert PRED_CACHE_TTL >= 1800
assert torch.get_num_threads() == 2
for model in ("linear_regression", "tree", "svr", "rbf", "lstm"):
    prediction_cache.clear()
    first = service.run_prediction("TEST", model)
    assert service.run_prediction("TEST", model) == first
    prediction_cache.clear()
    assert service.run_prediction("TEST", model) == first, model
print("All five models reproducible with and without cache")
