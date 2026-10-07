"""Full endpoint smoke; run against the local origin before exporting snapshots."""
import argparse
import json
import time
from urllib.parse import quote
from urllib.request import urlopen


def smoke(base):
    def get(path):
        with urlopen(base.rstrip("/") + path, timeout=15) as response:
            assert response.status == 200
            return json.load(response)

    assert {m["id"] for m in get("/api/markets")} == {"in", "us"}
    for market, count in (("in", 51), ("us", 7)):
        companies = get(f"/api/companies/?market={market}")
        assert len(companies) == count
        assert all(c["market"] == market for c in companies)
    status = get("/api/models/status")
    assert not status["failures"]
    assert len(status["tickers"]) == 58
    for symbol in ("RELIANCE.NS", "M&M.NS", "AAPL", "^NSEI"):
        encoded = quote(symbol, safe="")
        for route in ("ohlcv", "moving-average"):
            records = get(f"/api/stocks/{encoded}/{route}")
            assert records and records[-1]["close"] > 0
            if route == "moving-average":
                assert records[-1]["ma"] is not None
        prediction = get(f"/api/predictions/{encoded}/predict?model=linear_regression&horizon=5")
        assert prediction["ticker"] == symbol and prediction["forecast"]["horizon"] == 5
        best = get(f"/api/predictions/{encoded}/best-model?horizon=5")
        assert len(best["leaderboard"]) == 8 and "winner_beats_naive" in best
        print(f"PASS {symbol}: ohlcv, moving-average, predict, best-model", flush=True)
    assert get("/api/predictions/AAPL/predict?horizon=1")["forecast"]["horizon"] == 1
    samples = []
    for _ in range(9):  # Total 30 requests; preserve the existing shared rate limiter.
        start = time.perf_counter()
        get("/api/predictions/AAPL/predict?model=linear_regression&horizon=5")
        samples.append((time.perf_counter() - start) * 1000)
    p95 = sorted(samples)[-1]
    if base.startswith("http://127.0.0.1"):
        assert p95 < 100, p95
    print(json.dumps({"base": base, "cached_predict_p95_ms": p95, "samples_ms": samples}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:8100")
    smoke(parser.parse_args().base)
