"""Validate that the snapshot covers exactly the API company dropdown."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "frontend/public/data"


def read(path):
    return json.loads((root / (path + ".json")).read_text(encoding="utf-8"))


manifest = read("manifest")
companies = read("companies")
assert manifest["tickers"] == [c["ticker"] for c in companies]
assert len(companies) == 7
assert not manifest["failed_tickers"], manifest["failed_tickers"]
for ticker in manifest["tickers"]:
    for route in ("ohlcv", "moving-average"):
        records = read(f"stocks/{ticker}/{route}")
        assert records and all("close" in r and "date" in r for r in records)
    for model in manifest["models"]:
        response = read(f"predictions/{ticker}/predict/{model}")
        assert response["ticker"] == ticker
        assert len(response["records"]) == len(response["predictions"])
    assert len(read(f"predictions/{ticker}/best-model")["models"]) == 5
    assert read(f"companies/{ticker}/info")["ticker"] == ticker
print(f"Snapshot complete: {len(companies)} companies, {len(list(root.rglob('*.json')))} files")
