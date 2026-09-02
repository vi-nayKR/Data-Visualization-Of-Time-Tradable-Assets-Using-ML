import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class SlidingWindowRateLimiter:
    """
    High-performance in-memory sliding window rate limiter.
    Tracks requests per client IP within a configurable sliding time window.
    """
    def __init__(self):
        # Maps client_ip -> list of request timestamps
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._clean_interval = 60
        self._last_clean = time.time()

    def _cleanup_old_entries(self, now: float, window_seconds: int = 60):
        """Removes expired timestamps to prevent memory leaks."""
        if now - self._last_clean < self._clean_interval:
            return
        self._last_clean = now
        expired_cutoff = now - (window_seconds * 2)
        keys_to_delete = []
        for ip, timestamps in self._requests.items():
            valid_timestamps = [t for t in timestamps if t > expired_cutoff]
            if valid_timestamps:
                self._requests[ip] = valid_timestamps
            else:
                keys_to_delete.append(ip)
        for ip in keys_to_delete:
            del self._requests[ip]

    def is_allowed(self, client_ip: str, limit: int, window_seconds: int = 60) -> Tuple[bool, int, int]:
        """
        Evaluates if request is allowed.
        Returns: (is_allowed, remaining_requests, retry_after_seconds)
        """
        now = time.time()
        self._cleanup_old_entries(now, window_seconds)

        window_start = now - window_seconds
        timestamps = self._requests[client_ip]
        
        # Filter timestamps within current sliding window
        valid_timestamps = [t for t in timestamps if t > window_start]
        self._requests[client_ip] = valid_timestamps

        current_count = len(valid_timestamps)

        if current_count >= limit:
            oldest_timestamp = valid_timestamps[0]
            retry_after = max(1, int(window_seconds - (now - oldest_timestamp)))
            return False, 0, retry_after

        # Record this request
        self._requests[client_ip].append(now)
        remaining = limit - (current_count + 1)
        return True, remaining, 0

    def get_stats(self) -> Dict[str, int]:
        """Returns rate limiter operational metrics."""
        return {
            "tracked_clients": len(self._requests),
            "total_active_window_requests": sum(len(ts) for ts in self._requests.values())
        }

# Global singleton rate limiter instance
limiter = SlidingWindowRateLimiter()

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware applying contextual rate limiting based on path sensitivity:
    - /api/predictions (Heavy ML): 30 req/min
    - /api/stocks (Data & Indicators): 60 req/min
    - Other endpoints (Health/Companies): 120 req/min
    """
    async def dispatch(self, request: Request, call_next):
        # Extract client IP (handling X-Forwarded-For from Cloudflare / reverse proxy)
        forwarded_for = request.headers.get("cf-connecting-ip") or request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        elif request.client and request.client.host:
            client_ip = request.client.host
        else:
            client_ip = "127.0.0.1"

        path = request.url.path

        # Bypass rate limits for health checks and OpenAPI docs
        if path in ["/api/health", "/health", "/metrics", "/docs", "/openapi.json"]:
            return await call_next(request)

        # Dynamic limit tiers
        if path.startswith("/api/predictions"):
            limit = 30  # Heavy compute / ML training
            tier_name = "Machine Learning Inference"
        elif path.startswith("/api/stocks"):
            limit = 60  # Data fetching & Technical indicators
            tier_name = "Market Data"
        else:
            limit = 120 # General catalog & lookup
            tier_name = "Standard API"

        allowed, remaining, retry_after = limiter.is_allowed(client_ip, limit=limit, window_seconds=60)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "message": f"Rate limit exceeded for {tier_name}. Maximum {limit} requests per minute allowed.",
                    "limit": limit,
                    "retry_after_seconds": retry_after
                },
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(retry_after),
                    "Retry-After": str(retry_after),
                }
            )

        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
