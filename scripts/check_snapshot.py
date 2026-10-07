"""Validate that the snapshot covers exactly the API company dropdown."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "frontend/public/data"


def read(path):
    return json.loads((root / (path + ".json")).read_text(encoding="utf-8"))


manifest = read("manifest")
companies = [c for market in read("markets") for c in read(f"companies-{market['id']}")]
assert manifest["tickers"] == [c["ticker"] for c in companies]
assert len(read("companies-us")) == 7
assert len(read("companies-in")) > 0
assert not manifest["failed_tickers"], manifest["failed_tickers"]
for ticker in manifest["tickers"]:
    for route in ("ohlcv", "moving-average"):
        records = read(f"stocks/{ticker}/{route}")
        assert records and all("close" in r and "date" in r for r in records)
    for model in manifest["models"]:
        response = read(f"predictions/{ticker}/predict/{model}/h5")
        assert response["ticker"] == ticker
        assert response["forecast"]["horizon"] == 5
        assert response["forecast"]["lower"] <= response["forecast"]["upper"]
        assert "confidence" not in response
    assert len(read(f"predictions/{ticker}/best-model/h5")["models"]) == 8
    assert read(f"companies/{ticker}/info")["ticker"] == ticker
print(f"Snapshot complete: {len(companies)} companies, {len(list(root.rglob('*.json')))} files")
assert sum(p.stat().st_size for p in root.rglob('*.json')) < 20_000_000
