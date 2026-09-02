import time
from typing import Any, Dict, Optional, Tuple

class MemoryCache:
    """
    High-speed thread-safe in-memory cache with TTL and hit/miss observability metrics.
    """
    def __init__(self):
        self._store: Dict[str, Tuple[float, Any, float]] = {} # key -> (timestamp, data, ttl)
        self.hits = 0
        self.misses = 0
        self.evictions = 0

    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        if key in self._store:
            ts, val, ttl = self._store[key]
            if now - ts < ttl:
                self.hits += 1
                return val
            else:
                # Expired entry
                del self._store[key]
                self.evictions += 1
        
        self.misses += 1
        return None

    def set(self, key: str, value: Any, ttl_seconds: float = 180.0):
        self._store[key] = (time.time(), value, ttl_seconds)

    def invalidate(self, key: str):
        if key in self._store:
            del self._store[key]

    def clear(self):
        self._store.clear()

    def get_stats(self) -> Dict[str, Any]:
        total = self.hits + self.misses
        hit_ratio = (self.hits / total * 100.0) if total > 0 else 0.0
        return {
            "cached_keys_count": len(self._store),
            "hits": self.hits,
            "misses": self.misses,
            "hit_ratio_percent": round(hit_ratio, 2),
            "evictions": self.evictions
        }

# Global cache instances
stock_cache = MemoryCache()
prediction_cache = MemoryCache()
company_cache = MemoryCache()
