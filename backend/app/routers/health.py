import os
import sys
import time
import platform
from fastapi import APIRouter
from app.core.rate_limiter import limiter
from app.core.cache import stock_cache, prediction_cache, company_cache
from app.models.lstm_model import HAS_LSTM
import torch

router = APIRouter()

START_TIME = time.time()

@router.get("/health")
@router.get("/api/health")
async def health_check():
    """
    Production health check and system diagnostics endpoint.
    """
    uptime_seconds = int(time.time() - START_TIME)
    
    cuda_available = torch.cuda.is_available() if torch else False
    device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU (Apple Silicon / x86 SIMD)"

    return {
        "status": "healthy",
        "service": "stock-market-ml-dashboard-api",
        "version": "2.0.0",
        "uptime_seconds": uptime_seconds,
        "environment": {
            "os": platform.system(),
            "python_version": sys.version.split()[0],
            "pytorch_lstm_available": HAS_LSTM,
            "compute_device": device_name
        },
        "rate_limiter": limiter.get_stats(),
        "cache": {
            "stocks": stock_cache.get_stats(),
            "predictions": prediction_cache.get_stats(),
            "companies": company_cache.get_stats()
        }
    }

@router.get("/metrics")
@router.get("/api/metrics")
async def prometheus_metrics():
    """
    Lightweight observability metrics endpoint.
    """
    uptime = time.time() - START_TIME
    limiter_stats = limiter.get_stats()
    stock_stats = stock_cache.get_stats()
    pred_stats = prediction_cache.get_stats()

    metrics = [
        f"# HELP dataviz_uptime_seconds Total service uptime in seconds",
        f"# TYPE dataviz_uptime_seconds counter",
        f"dataviz_uptime_seconds {uptime:.2f}",
        f"# HELP dataviz_tracked_clients Active IP addresses tracked by rate limiter",
        f"# TYPE dataviz_tracked_clients gauge",
        f"dataviz_tracked_clients {limiter_stats['tracked_clients']}",
        f"# HELP dataviz_cache_hits Total cache hits",
        f"# TYPE dataviz_cache_hits counter",
        f"dataviz_cache_hits{{type=\"stocks\"}} {stock_stats['hits']}",
        f"dataviz_cache_hits{{type=\"predictions\"}} {pred_stats['hits']}",
        f"# HELP dataviz_cache_misses Total cache misses",
        f"# TYPE dataviz_cache_misses counter",
        f"dataviz_cache_misses{{type=\"stocks\"}} {stock_stats['misses']}",
        f"dataviz_cache_misses{{type=\"predictions\"}} {pred_stats['misses']}"
    ]
    return "\n".join(metrics)
