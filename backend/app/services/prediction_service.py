"""Read-only serving of offline artifacts. This module never imports training code."""
import json
import os
from pathlib import Path
from functools import lru_cache

from app.services.company_service import CompanyService
from app.services.market_data import symbol_path

MODEL_DIR = Path(os.getenv("STOCK_MODEL_DIR", "/var/lib/stock-api/models"))

@lru_cache(maxsize=256)
def read_artifact(path, modified_ns):
    return json.loads(Path(path).read_text())

class PredictionService:
    def artifact(self, ticker, horizon=5):
        if horizon not in (1, 5):
            raise ValueError("horizon must be 1 or 5")
        if not CompanyService().lookup(ticker):
            raise FileNotFoundError("not trained yet")
        symbol_path(ticker)  # Validate before using an untrusted path segment.
        path = MODEL_DIR / ticker / f"h{horizon}.json"
        return read_artifact(str(path), path.stat().st_mtime_ns)

    def run_prediction(self, ticker, model_type="linear_regression", horizon=5):
        artifact = self.artifact(ticker, horizon)
        model = next((m for m in artifact["models"] if m["name"] == model_type), None)
        if model is None:
            raise ValueError("Unknown model")
        naive = next(m for m in artifact["models"] if m["name"] == "naive")
        return {**{key:artifact[key] for key in ("ticker","market","currency","as_of","trained_at","git_sha","evaluation")},
                "model":model_type,"metrics":model["metrics"],"validation_mae":model["validation_mae"],
                "forecast":model["forecast"],"naive":naive["forecast"]}

    def find_best_model(self, ticker, horizon=5):
        artifact = self.artifact(ticker, horizon)
        return {**artifact,"leaderboard":artifact["models"]}

    def status(self):
        return json.loads((MODEL_DIR / "index.json").read_text())
