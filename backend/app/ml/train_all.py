"""python -m app.ml.train_all: offline, atomic per-ticker artifact publication."""
import argparse
from datetime import datetime, timezone
import fcntl
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time

from app.ml.evaluate import evaluate
from app.services.company_service import CompanyService
from app.services.market_data import download

MODEL_DIR = Path(os.getenv("STOCK_MODEL_DIR", "/var/lib/stock-api/models"))


def atomic_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, delete=False) as tmp:
        temporary = Path(tmp.name)
        json.dump(data, tmp, allow_nan=False, separators=(",", ":"))
        tmp.flush()
        os.fsync(tmp.fileno())
    try:
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def run(symbols=None):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with (MODEL_DIR / ".train.lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        start = time.monotonic()
        catalog = CompanyService()
        sha = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
        status = {"trained_at": datetime.now(timezone.utc).isoformat(), "git_sha": sha, "tickers": {}, "failures": {}, "data_as_of": {}}
        for market in catalog.markets:
            for company in catalog.get_all_companies(market["id"]):
                symbol = company["ticker"]
                if symbols and symbol not in symbols:
                    continue
                try:
                    bars = download(symbol)
                    as_of = str(bars.index[-1].date())
                    for horizon in (1, 5):
                        artifact = evaluate(bars, horizon)
                        artifact.update(ticker=symbol, market=company["market"], currency=company["currency"],
                                        as_of=as_of, trained_at=datetime.now(timezone.utc).isoformat(), git_sha=sha)
                        atomic_json(MODEL_DIR / symbol / f"h{horizon}.json", artifact)
                    status["tickers"][symbol] = {"status": "ok", "market": company["market"], "as_of": as_of}
                    status["data_as_of"].setdefault(company["market"], []).append(as_of)
                    print(f"OK {symbol} as_of={as_of}", flush=True)
                except Exception as error:
                    status["failures"][symbol] = str(error)
                    status["tickers"][symbol] = {"status": "failed", "market": company["market"]}
                    print(f"FAILED {symbol}: {error}", flush=True)
                finally:
                    time.sleep(1)
        # A conservative market date exposes the oldest successful ticker date.
        status["data_as_of"] = {key: min(dates) for key, dates in status["data_as_of"].items()}
        status["duration_seconds"] = time.monotonic()-start
        atomic_json(MODEL_DIR / "index.json", status)
        print(json.dumps(status), flush=True)
        if status["failures"]:
            raise SystemExit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbols", nargs="+")
    run(parser.parse_args().symbols)
