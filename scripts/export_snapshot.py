"""Export the same service/route responses as the API, without HTTP rate limits."""
import argparse
import asyncio
from datetime import datetime, timezone
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from fastapi.encoders import jsonable_encoder
from app.routers.companies import company_info
from app.services.company_service import CompanyService
from app.services.stock_service import StockService
from app.services.prediction_service import PredictionService

MODELS = ["linear_regression", "tree", "svr", "rbf", "lstm"]


async def export(output):
    companies = CompanyService().get_all_companies()
    stocks, predictions = StockService(), PredictionService()
    failed = {}

    def write(path, response):
        if not response or isinstance(response, dict) and "error" in response:
            raise ValueError(f"Empty/error response: {path}")
        target = output / (path + ".json")
        target.parent.mkdir(parents=True, exist_ok=True)
        text = json.dumps(jsonable_encoder(response), allow_nan=False, separators=(",", ":"))
        target.write_text(text, encoding="utf-8")

    write("companies", companies)
    for company in companies:
        ticker = company["ticker"]
        try:
            write(f"stocks/{ticker}/ohlcv", stocks.get_historical_data(ticker, "180d"))
            write(f"stocks/{ticker}/moving-average", stocks.get_with_moving_average(ticker, 50, "180d"))
            for model in MODELS:
                write(f"predictions/{ticker}/predict/{model}", predictions.run_prediction(ticker, model))
            write(f"predictions/{ticker}/best-model", predictions.find_best_model(ticker))
            write(f"companies/{ticker}/info", await company_info(ticker))
            print(f"Exported {ticker}", flush=True)
        except Exception as error:
            failed[ticker] = str(error)
            print(f"FAILED {ticker}: {error}", file=sys.stderr, flush=True)
    write("manifest", {"generated_at": datetime.now(timezone.utc).isoformat(),
                       "tickers": [c["ticker"] for c in companies], "models": MODELS,
                       "failed_tickers": failed, "period": "180d", "ma_days": 50})
    print(f"Bytes: {sum(p.stat().st_size for p in output.rglob('*.json'))}; failed: {failed}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "frontend/public/data")
    asyncio.run(export(parser.parse_args().output))
