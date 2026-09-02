import time
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response

class SecurityAndObservabilityMiddleware(BaseHTTPMiddleware):
    """
    Applies security headers and calculates request processing time for observability.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        response: Response = await call_next(request)
        
        process_time_ms = (time.perf_counter() - start_time) * 1000.0
        
        # Performance & Observability Headers
        response.headers["X-Process-Time"] = f"{process_time_ms:.2f}ms"
        response.headers["Server"] = "DataViz-ML/2.0 (FastAPI-PyTorch)"
        
        # Standard OWASP Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response
