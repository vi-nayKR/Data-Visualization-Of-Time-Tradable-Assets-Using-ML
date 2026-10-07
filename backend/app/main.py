from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import stocks, predictions, companies, health
from app.services.company_service import CompanyService
from app.core.rate_limiter import RateLimitMiddleware
from app.core.security import SecurityAndObservabilityMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.company_service = CompanyService()
    yield

app = FastAPI(
    title="Data Visualization of Time-Tradable Assets Using ML API",
    version="2.0.0",
    description="Production-grade FastAPI & PyTorch backend for quantitative charting, technical indicators, and ML forecasting.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# 1. Rate Limiting Middleware (30 req/min for ML inference, 60 req/min for Data, 120 req/min for others)
app.add_middleware(RateLimitMiddleware)

# 2. Security Headers & Observability Middleware (X-Process-Time, OWASP security headers)
app.add_middleware(SecurityAndObservabilityMiddleware)

# 3. CORS Middleware (Supports Cloudflare Workers frontend and local development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "https://data-visualization-of-time-tradable-assets-using-ml.medhainnovation2026.workers.dev,http://localhost:4200").split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, tags=["Health & Observability"])
app.include_router(stocks.router, prefix="/api/stocks", tags=["Stocks & Technical Indicators"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Machine Learning Forecasts"])
app.include_router(companies.router, prefix="/api/companies", tags=["Companies & Watchlist"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

@app.get("/api/markets")
def markets():
    return CompanyService().markets

@app.get("/api/models/status")
def models_status():
    from app.routers.predictions import serve, prediction_service
    return serve(prediction_service.status)
