# Data Visualization of Time-Tradable Assets Using ML

An Angular 22 and FastAPI market-data terminal built around a 2023 IEEE student research publication, **“Data Visualisation of Time Tradable Assets Using Machine Learning.”** It lets a user inspect historical OHLCV data, overlay common technical indicators, and compare a small set of forecasting-model implementations.

This is a portfolio and learning project, **not investment advice, a trading system, or a validated price-prediction service**. The interface must not be presented as proof that a forecast is accurate or financially actionable.

## What is implemented

- Angular 22 standalone frontend with signal-based shared terminal state, company search, theme preference, and responsive terminal UI.
- Plotly-based candlestick/price visualizations with SMA, EMA, Bollinger Bands, RSI, and MACD values calculated by the API.
- FastAPI endpoints for company metadata, historical OHLCV data, technical indicators, predictions, best-model comparison, and health checks.
- Yahoo Finance data retrieval through `yfinance`, with a 60-second process-local data cache.
- Linear regression, decision-tree, linear-SVR, RBF-SVR, and PyTorch LSTM code paths. Prediction responses are cached in process for 90 seconds.
- A 50-sample shifted-target demonstration displayed in the UI as a 50-trading-day projection.
- Deployment assets for a Cloudflare Pages frontend and a systemd-managed FastAPI backend on a personal server, exposed through a Cloudflare tunnel.

## Important model boundary

The current prediction implementation trains against a shifted close-price target from a downloaded 200-day series, uses a random `train_test_split`, and returns predictions aligned to the final portion of the returned historical records. It is a code demonstration, not a walk-forward forecast evaluation. The displayed R² is a held-out score from that split; it is **not** a measure of future market performance and must not be called “model confidence.”

Before making any accuracy or trading-performance claim, add a time-ordered train/validation/test split, a naive baseline, walk-forward evaluation, saved run metadata, error metrics, and a clear separation between in-sample estimates and future dates.

## Architecture

```text
Browser
  └─ Angular 22 + Plotly terminal
       └─ HTTP API
            └─ FastAPI
                 ├─ StockService → yfinance → process-local TTL cache
                 ├─ indicator calculations → JSON records
                 └─ PredictionService → scikit-learn / optional PyTorch → TTL cache
```

The Cloudflare frontend and the FastAPI backend are separately deployed. The checked-in production environment points at a temporary Cloudflare Tunnel URL; treat that endpoint as operational configuration which may change, not a permanent public API contract.

## Local setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API health endpoint is `http://localhost:8000/api/health`.

### Frontend

Set `frontend/src/environments/environment.ts` to the appropriate local API URL, then:

```bash
cd frontend
npm install
npm start
```

For a production bundle:

```bash
npm run build
```

## API surface

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Process health response |
| `GET /api/companies` | Supported company/ticker list |
| `GET /api/stocks/{ticker}/ohlcv?period=180d` | Historical OHLCV records |
| `GET /api/stocks/{ticker}/moving-average?days=50&period=180d` | OHLCV plus technical-indicator values |
| `GET /api/predictions/{ticker}/predict?model=linear_regression` | One model demonstration |
| `GET /api/predictions/{ticker}/best-model` | Compares configured model paths on the current data sample |

## Interview-safe project summary

> I built a split Angular and FastAPI market-data terminal: Angular holds terminal state and renders Plotly charts, while FastAPI retrieves OHLCV data, computes indicators, and exposes several small forecasting-model implementations. I used short TTL caches because interactive selection changes can otherwise repeat external data requests and model work. I’m explicit that the current forecasting path is a learning demonstration, not a trading signal: it needs time-series backtesting and baselines before any predictive-performance claim.

For deeper preparation and the precise claim boundaries, see [the project story bank](../Resume/Guide/03_PROJECT_STORY_BANK.md#data-visualization-of-time-tradable-assets-using-ml) and [the interview guide](../Resume/Guide/02_INTERVIEW_PREPARATION.md#data-visualization-of-time-tradable-assets-using-ml).

## Repository layout

```text
frontend/                 Angular 22 application
backend/app/              FastAPI routes, services, schemas, and LSTM model
deploy/                   systemd, Nginx, tunnel, and deployment assets
Untitled.ipynb            exploratory notebook
data_analysis.py          earlier analysis script
```

## Current limitations and next work

- The API permits all CORS origins; deploy a restricted allow-list before treating it as a production service.
- Cache entries are process-local, so they do not coordinate across workers or survive a restart.
- There is no authentication, rate limiting, persistent cache, API-provider fallback, or automated endpoint/model test suite. CI currently builds the Angular app and compiles the FastAPI package.
- Fundamentals shown in the UI include placeholder/static values and need a source-backed API before being described as live financial data.
- The LSTM is trained on demand and has no persisted artifacts, seed/run tracking, or comparative backtest report.

## License

MIT; see [LICENSE](LICENSE). This does not make the project suitable for investment decisions.
