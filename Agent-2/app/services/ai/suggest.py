from typing import Literal, Mapping, Any

import httpx
from app.core.config import settings
from httpx import HTTPStatusError
import logging
logger = logging.getLogger(__name__)

OPENAI_API_KEY = settings.OPENAI_API_KEY
OPENAI_BASE_URL = settings.OPENAI_BASE_URL or "https://api.openai.com/v1"
MODEL = settings.OPENAI_MODEL or "gpt-4o-mini"

async def suggest(kind: Literal["reply","rebuttal","pricing","pitch"], context: Mapping[str, Any]) -> str:
	if not settings.ENABLE_OPENAI or not OPENAI_API_KEY:
		return ""
	prompt = f"Generate a concise {kind} based on context: {context}"
	try:
		async with httpx.AsyncClient(timeout=60) as client:
			resp = await client.post(
				f"{OPENAI_BASE_URL}/chat/completions",
				headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
				json={
					"model": MODEL,
					"messages": [
						{"role": "system", "content": "You are a sales assistant."},
						{"role": "user", "content": prompt},
					],
				},
			)
			resp.raise_for_status()
			data = resp.json()
			return data.get("choices", [{}])[0].get("message", {}).get("content", "")
	except HTTPStatusError as e:
		status = e.response.status_code if e.response else None
		url = str(e.request.url) if e.request else None
		logger.warning("openai_suggest_failed status=%s url=%s", status, url)
		return ""
	except Exception:
		logger.exception("openai_suggest_failed_unexpected")
		return ""
