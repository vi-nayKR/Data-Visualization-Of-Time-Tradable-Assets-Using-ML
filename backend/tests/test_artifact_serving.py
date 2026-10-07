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
                "models":[{"name":name,"metrics":{},"validation_mae":.01,"forecast":{"price":100}} for name in ("naive","linear_regression")]}
    path.write_text(json.dumps(artifact))
    assert service.run_prediction("AAPL")["forecast"]["price"] == 100
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
