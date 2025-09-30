import time
from fastapi import HTTPException, Request


_buckets: dict[str, list[float]] = {}


def rate_limiter(max_requests: int = 60, window_seconds: int = 60):
	async def _dep(request: Request):
		key = request.headers.get("Authorization") or request.client.host or "anon"
		now = time.time()
		bucket = _buckets.setdefault(key, [])
		# prune
		cutoff = now - window_seconds
		while bucket and bucket[0] < cutoff:
			bucket.pop(0)
		if len(bucket) >= max_requests:
			raise HTTPException(status_code=429, detail="Rate limit exceeded")
		bucket.append(now)
		return True
	return _dep


