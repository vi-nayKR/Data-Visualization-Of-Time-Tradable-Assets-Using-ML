from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import stocks, predictions, companies
from app.services.company_service import CompanyService

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.company_service = CompanyService()
    yield

app = FastAPI(
    title="Stock Market Dashboard API",
    version="2.0.0",
    description="FastAPI Backend for Time-Tradable Assets Data Visualization & ML Prediction",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Cloudflare Pages frontend and local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router, prefix="/api/stocks", tags=["Stocks"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(companies.router, prefix="/api/companies", tags=["Companies"])

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "stock-api", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
