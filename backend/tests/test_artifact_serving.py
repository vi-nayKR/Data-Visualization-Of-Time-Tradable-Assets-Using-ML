import json
import os
import asyncio
from pathlib import Path
from urllib.parse import quote, unquote

import pytest

from app.services import prediction_service
from app.services.market_data import symbol_path


async def asgi_request(app, path, query=""):
    messages = []
    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}
    async def send(message):
        messages.append(message)
    await app({"type":"http", "asgi":{"version":"3.0"}, "http_version":"1.1",
               "method":"GET", "scheme":"http", "path":unquote(path), "raw_path":path.encode(),
               "query_string":query.encode(), "root_path":"", "headers":[],
               "client":("127.0.0.1",1), "server":("localhost",80)}, receive, send)
    return messages[0]["status"], json.loads(messages[1]["body"])


def test_only_artifacts_and_atomic_replacement(tmp_path, monkeypatch):
    monkeypatch.setattr(prediction_service, "MODEL_DIR", tmp_path)
    service = prediction_service.PredictionService()
    with pytest.raises(FileNotFoundError):
        service.run_prediction("AAPL")
    path = tmp_path / "AAPL" / "h5.json"
    path.parent.mkdir()
    artifact = {"ticker":"AAPL", "market":"us", "currency":"USD", "as_of":"2026-01-01",
                "trained_at":"2026-01-01T00:00:00Z", "git_sha":"test", "evaluation":{},
                "winner":"linear_regression",
                "models":[{"name":name,"metrics":{"skill_vs_naive":-.1},"validation_mae":.01,"forecast":{"price":100}} for name in ("naive","linear_regression")]}
    path.write_text(json.dumps(artifact))
    assert service.run_prediction("AAPL")["forecast"]["price"] == 100
    assert service.find_best_model("AAPL")["winner_beats_naive"] is False
    artifact["models"][1]["forecast"]["price"] = 200
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(artifact))
    temporary.replace(path)
    assert service.run_prediction("AAPL")["forecast"]["price"] == 200
    with pytest.raises(ValueError):
        service.run_prediction("AAPL", "unknown")
    with pytest.raises(FileNotFoundError):
        service.run_prediction("../AAPL")
    assert "app.ml.evaluate" not in Path(prediction_service.__file__).read_text()


@pytest.mark.parametrize("status", [False, True])
def test_atomic_replacement_with_identical_size_and_mtime(tmp_path, monkeypatch, status):
    monkeypatch.setattr(prediction_service, "MODEL_DIR", tmp_path)
    service = prediction_service.PredictionService()
    path = tmp_path / "index.json" if status else tmp_path / "AAPL" / "h5.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('{"price":100}')
    read = service.status if status else lambda: service.artifact("AAPL")
    assert read()["price"] == 100
    original = path.stat()
    temporary = path.with_suffix(".tmp")
    temporary.write_text('{"price":200}')
    os.utime(temporary, ns=(original.st_atime_ns, original.st_mtime_ns))
    temporary.replace(path)
    replaced = path.stat()
    assert replaced.st_size == original.st_size
    assert replaced.st_mtime_ns == original.st_mtime_ns
    assert replaced.st_ino != original.st_ino
    assert read()["price"] == 200


def test_query_horizon_parsing(monkeypatch):
    from fastapi import FastAPI
    from app.routers import predictions
    app = FastAPI()
    app.include_router(predictions.router)

    def response(ticker, *args):
        horizon = args[-1]
        if horizon not in (1, 5):
            raise ValueError("horizon must be 1 or 5")
        return {"horizon": horizon}
    monkeypatch.setattr(predictions.prediction_service, "run_prediction", response)
    monkeypatch.setattr(predictions.prediction_service, "find_best_model", response)

    for route in ("predict", "best-model"):
        for value in (1, 5):
            status, data = asyncio.run(asgi_request(app, f"/AAPL/{route}", f"horizon={value}"))
            assert status == 200
            assert data["horizon"] == value
        assert asyncio.run(asgi_request(app, f"/AAPL/{route}", "horizon=2"))[0] == 400
        assert asyncio.run(asgi_request(app, f"/AAPL/{route}", "horizon=invalid"))[0] == 422


def test_ampersand_symbol_artifact_and_encoded_routes(tmp_path, monkeypatch):
    from fastapi import FastAPI
    from app.routers import predictions
    ticker = "M&M.NS"
    assert symbol_path(ticker, tmp_path) == tmp_path / "M&M.NS.csv"
    for invalid in ("m&m.ns", "A_B", "../AAPL", "A/B", "A\\B", "A;B", "A B", "A%26B", "A"*41):
        with pytest.raises(ValueError):
            symbol_path(invalid, tmp_path)
    monkeypatch.setattr(prediction_service, "MODEL_DIR", tmp_path)
    artifact = {"ticker":ticker,"market":"in","currency":"INR","as_of":"2026-01-01",
                "trained_at":"2026-01-01T00:00:00Z","git_sha":"test","evaluation":{},
                "winner":"linear_regression","beats_naive":False,
                "models":[{"name":name,"metrics":{"skill_vs_naive":0},"validation_mae":.01,
                           "forecast":{"price":100,"horizon":5}} for name in ("naive","linear_regression")]}
    path = tmp_path / ticker / "h5.json"
    path.parent.mkdir()
    path.write_text(json.dumps(artifact))
    assert prediction_service.PredictionService().artifact(ticker)["ticker"] == ticker
    encoded = quote(ticker, safe="")
    assert encoded == "M%26M.NS"
    app = FastAPI()
    app.include_router(predictions.router, prefix="/api/predictions")
    for route in ("predict", "best-model"):
        status, data = asyncio.run(asgi_request(app, f"/api/predictions/{encoded}/{route}", "horizon=5"))
        assert status == 200
        assert data["ticker"] == ticker


def test_stock_routes_read_temp_disk_cache(tmp_path, monkeypatch):
    import pandas as pd
    from fastapi import FastAPI
    from app.routers import stocks
    from app.services import market_data
    from app.core.cache import stock_cache

    raw = tmp_path / "raw"
    raw.mkdir()
    monkeypatch.setattr(market_data, "symbol_path", lambda symbol: symbol_path(symbol, raw))
    stock_cache.clear()
    app = FastAPI()
    app.include_router(stocks.router, prefix="/api/stocks")
    bars = pd.DataFrame({"Open":100., "High":102., "Low":99., "Close":101., "Volume":1000000},
                        index=pd.bdate_range("2026-01-01", periods=80))
    for ticker in ("RELIANCE.NS", "M&M.NS", "AAPL"):
        bars.to_csv(symbol_path(ticker, raw), index_label="Date")
        for route in ("ohlcv", "moving-average"):
            path = f"/api/stocks/{quote(ticker, safe='')}/{route}"
            for _ in range(2):  # Exercise the disk reader and the in-memory hit.
                status, records = asyncio.run(asgi_request(app, path))
                assert status == 200
                assert len(records) == 80
                assert records[-1]["close"] == 101
                if route == "moving-average":
                    assert records[-1]["ma"] == 101
    stock_cache.clear()
