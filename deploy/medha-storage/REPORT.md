# Stock API deployment verification — 2026-10-07

Live frontend: https://data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev
API: https://stock-api.medhainnovation.com
Workers version: 86fe882b-273e-440c-bf9b-111f47690ddb
Backend checkout: cb81aececbf7fb2feaa75cb034ea33bb52769987 (frontend-only fixes are deployed separately).
The new Workers account/domain was explicitly approved. The old vinaykr.workers.dev site is unchanged.

## Measurements

- First uncached RELIANCE.NS LSTM request: 1.671553 s; cached: 0.006876 s.
- Repeat after restart with the existing Yahoo cache: 0.580669 s; cached: 0.007070 s.
- Highest observed stock-api cgroup memory peak: 367,939,584 bytes (350.9 MiB).
- Process RSS high-water mark after final browser checks: 503,892 KiB (492.1 MiB).
- Final stock-api cgroup peak after fallback restart: 363,552,768 bytes (346.7 MiB).
- API limits: MemoryMax=1500M, MemoryHigh=1200M, MemorySwapMax=0, CPUQuota=200%.
- Final cloudflared memory: 28,139,520 bytes; peak: 30,486,528 bytes; existing limit: 268,435,456 bytes.
- CPU-only torch 2.14.1+cpu; venv: 1,294,546,539 bytes, below the 1.5 GB gate.
- Snapshot: 2,661,198 bytes (2.54 MiB), 65 JSON files, seven tickers, five models; no failed tickers.
- Snapshot timestamp: 2026-10-07T07:56:31.062257+00:00.
- Yahoo reports some fundamentals unavailable; the API and snapshot use the same existing empty-field behavior.

## Verification

- Production Angular build and Wrangler dry-run pass; production deployment succeeds.
- Offline prediction check passes for all five models, with and without cache.
- Snapshot completeness check passes and companies.json matches GET /api/companies/ exactly.
- Headless Chromium visits /, /analysis, /prediction, /best-analysis on the live site.
- All three data pages render Plotly charts and Live / Not financial advice badges.
- Live browser check: eight calls to stock-api.medhainnovation.com, zero console/page errors, zero 404 responses.
- Actual service-down test: stopped stock-api with a detached two-minute recovery timer; public health returned 502.
- All three data pages rendered snapshots with Snapshot · 2026-10-07 badges and Not financial advice.
- Snapshot browser check: zero 404s or unexpected application errors. Fifteen expected browser transport/CORS diagnostics came from the unavailable cross-origin API's Cloudflare 502 responses; these are excluded only in offline mode.
- stock-api was restarted in finally; the recovery timer was cancelled; the live browser check passes again with zero console errors.
- Final public checks: API health, medhainnovation.com, api.medhainnovation.com/health, admin.medhainnovation.com all HTTP 200.
- Final SSH checks: medha-storage -> medha-storage-node; medha-worker -> medha-worker-node.
- cloudflared and stock-api active; Docker inactive; no pending stock-api recovery/rollback timers.
- API listens only on 127.0.0.1:8100. CORS allows only the approved Workers origin; credentials disabled.
- Prediction cache TTL is 30 minutes; PyTorch and numerical-library threads limited to two.
- No firewall, sshd, Docker, other ingress rules, or cloudflared service limits changed. No DNS route command was run.
- Initial external 502 triggered rollback. The final rule uses explicit IPv4 loopback. No journal line confirmed IPv6 as the cause; IPv4 health was 200 and IPv6 refused the connection.
- Separate fixes: b602c55 corrects the SVG path; 554b832 guards drawing-tool relayout until Plotly.react resolves.

Snapshot fallback uses the requested saved 180-day history and SMA 50, and explicitly labels those fixed snapshot parameters.

## Server files and state changed

- /etc/systemd/system/stock-api.service
- /etc/systemd/system/multi-user.target.wants/stock-api.service (enablement symlink)
- /etc/cloudflared/config.yml: only the stock-api hostname rule before the catch-all; service http://127.0.0.1:8100.
- /etc/cloudflared/config.yml.20261007T074431Z.bak
- /etc/cloudflared/config.yml.20261007T075330Z.bak (current rollback target)
- /var/lib/stock-api-deploy/tunnel-backup
- /var/lib/stock-api-deploy/rollback-timer
- /var/lib/stock-api-deploy/rollback.sh
- /opt/stock-api/app/: public repository checkout and its git metadata; backend/deployment files match the backend revision above.
- /opt/stock-api/venv/: CPU-only Python dependencies installed by setup.sh.
- /var/cache/stock-api/: yfinance cache and snapshot/ containing the 65 exported JSON files.
- /tmp/stock-api-setup.sh, /tmp/stock-api-ohlcv.json, /tmp/stock-api-lstm.json, /tmp/stock-api-lstm-cached.json (setup/test artifacts).
- stockapi system account and group (system account databases managed by useradd/userdel during setup and rollback).
- Debian packages installed with the exact approved apt command: python3.13-venv and its required python3-pip-whl / python3-setuptools-whl dependencies. No upgrades or other explicit package requests.
- Transient systemd restart, rollback, snapshot-export and fallback-recovery units were created; no recovery timer remains active.

## Repository files changed

The complete source and snapshot file list follows. This report itself is also added.

- `backend/app/main.py`
- `backend/app/services/prediction_service.py`
- `deploy/medha-storage/export.sh`
- `deploy/medha-storage/fallback.sh`
- `deploy/medha-storage/rollback.sh`
- `deploy/medha-storage/setup.sh`
- `deploy/medha-storage/stock-api.service`
- `deploy/medha-storage/tunnel.sh`
- `deploy/medha-storage/verify-tunnel.ps1`
- `frontend/angular.json`
- `frontend/public/data/companies.json`
- `frontend/public/data/companies/AAPL/info.json`
- `frontend/public/data/companies/AMZN/info.json`
- `frontend/public/data/companies/GOOGL/info.json`
- `frontend/public/data/companies/META/info.json`
- `frontend/public/data/companies/MSFT/info.json`
- `frontend/public/data/companies/NVDA/info.json`
- `frontend/public/data/companies/TSLA/info.json`
- `frontend/public/data/manifest.json`
- `frontend/public/data/predictions/AAPL/best-model.json`
- `frontend/public/data/predictions/AAPL/predict/linear_regression.json`
- `frontend/public/data/predictions/AAPL/predict/lstm.json`
- `frontend/public/data/predictions/AAPL/predict/rbf.json`
- `frontend/public/data/predictions/AAPL/predict/svr.json`
- `frontend/public/data/predictions/AAPL/predict/tree.json`
- `frontend/public/data/predictions/AMZN/best-model.json`
- `frontend/public/data/predictions/AMZN/predict/linear_regression.json`
- `frontend/public/data/predictions/AMZN/predict/lstm.json`
- `frontend/public/data/predictions/AMZN/predict/rbf.json`
- `frontend/public/data/predictions/AMZN/predict/svr.json`
- `frontend/public/data/predictions/AMZN/predict/tree.json`
- `frontend/public/data/predictions/GOOGL/best-model.json`
- `frontend/public/data/predictions/GOOGL/predict/linear_regression.json`
- `frontend/public/data/predictions/GOOGL/predict/lstm.json`
- `frontend/public/data/predictions/GOOGL/predict/rbf.json`
- `frontend/public/data/predictions/GOOGL/predict/svr.json`
- `frontend/public/data/predictions/GOOGL/predict/tree.json`
- `frontend/public/data/predictions/META/best-model.json`
- `frontend/public/data/predictions/META/predict/linear_regression.json`
- `frontend/public/data/predictions/META/predict/lstm.json`
- `frontend/public/data/predictions/META/predict/rbf.json`
- `frontend/public/data/predictions/META/predict/svr.json`
- `frontend/public/data/predictions/META/predict/tree.json`
- `frontend/public/data/predictions/MSFT/best-model.json`
- `frontend/public/data/predictions/MSFT/predict/linear_regression.json`
- `frontend/public/data/predictions/MSFT/predict/lstm.json`
- `frontend/public/data/predictions/MSFT/predict/rbf.json`
- `frontend/public/data/predictions/MSFT/predict/svr.json`
- `frontend/public/data/predictions/MSFT/predict/tree.json`
- `frontend/public/data/predictions/NVDA/best-model.json`
- `frontend/public/data/predictions/NVDA/predict/linear_regression.json`
- `frontend/public/data/predictions/NVDA/predict/lstm.json`
- `frontend/public/data/predictions/NVDA/predict/rbf.json`
- `frontend/public/data/predictions/NVDA/predict/svr.json`
- `frontend/public/data/predictions/NVDA/predict/tree.json`
- `frontend/public/data/predictions/TSLA/best-model.json`
- `frontend/public/data/predictions/TSLA/predict/linear_regression.json`
- `frontend/public/data/predictions/TSLA/predict/lstm.json`
- `frontend/public/data/predictions/TSLA/predict/rbf.json`
- `frontend/public/data/predictions/TSLA/predict/svr.json`
- `frontend/public/data/predictions/TSLA/predict/tree.json`
- `frontend/public/data/stocks/AAPL/moving-average.json`
- `frontend/public/data/stocks/AAPL/ohlcv.json`
- `frontend/public/data/stocks/AMZN/moving-average.json`
- `frontend/public/data/stocks/AMZN/ohlcv.json`
- `frontend/public/data/stocks/GOOGL/moving-average.json`
- `frontend/public/data/stocks/GOOGL/ohlcv.json`
- `frontend/public/data/stocks/META/moving-average.json`
- `frontend/public/data/stocks/META/ohlcv.json`
- `frontend/public/data/stocks/MSFT/moving-average.json`
- `frontend/public/data/stocks/MSFT/ohlcv.json`
- `frontend/public/data/stocks/NVDA/moving-average.json`
- `frontend/public/data/stocks/NVDA/ohlcv.json`
- `frontend/public/data/stocks/TSLA/moving-average.json`
- `frontend/public/data/stocks/TSLA/ohlcv.json`
- `frontend/src/app/core/services/stock-api.service.ts`
- `frontend/src/app/features/best-analysis/best-analysis.component.ts`
- `frontend/src/app/features/data-analysis/candlestick-chart.component.ts`
- `frontend/src/app/features/data-analysis/data-analysis.component.ts`
- `frontend/src/app/features/prediction/prediction.component.ts`
- `frontend/src/environments/environment.prod.ts`
- `frontend/src/environments/environment.ts`
- `scripts/check_browser.cjs`
- `scripts/check_predictions.py`
- `scripts/check_snapshot.py`
- `scripts/export_snapshot.py`
- `deploy/medha-storage/REPORT.md`
