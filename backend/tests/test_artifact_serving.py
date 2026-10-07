import json
from pathlib import Path

import pytest

from app.services import prediction_service


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


def test_query_horizon_parsing(monkeypatch):
    import asyncio
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

    async def request(path, query):
        messages = []
        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}
        async def send(message):
            messages.append(message)
        await app({"type":"http", "asgi":{"version":"3.0"}, "http_version":"1.1",
                   "method":"GET", "scheme":"http", "path":path, "raw_path":path.encode(),
                   "query_string":query.encode(), "root_path":"", "headers":[],
                   "client":("127.0.0.1",1), "server":("localhost",80)}, receive, send)
        return messages[0]["status"], json.loads(messages[1]["body"])

    for route in ("predict", "best-model"):
        for value in (1, 5):
            status, data = asyncio.run(request(f"/AAPL/{route}", f"horizon={value}"))
            assert status == 200
            assert data["horizon"] == value
        assert asyncio.run(request(f"/AAPL/{route}", "horizon=2"))[0] == 400
        assert asyncio.run(request(f"/AAPL/{route}", "horizon=invalid"))[0] == 422
