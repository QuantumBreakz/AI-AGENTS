import os
from typing import Literal, Mapping, Any

import httpx

from app.core.config import settings

async def suggest(kind: Literal["pitch","objection"], context: Mapping[str, Any]) -> str:
	if not settings.OPENAI_API_KEY:
		return ""
	prompt = f"Generate a concise {kind} response based on context: {context}"
	base = settings.OPENAI_BASE_URL or "https://api.openai.com/v1"
	async with httpx.AsyncClient(timeout=60) as client:
		resp = await client.post(
			f"{base}/chat/completions",
			headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
			json={
				"model": settings.OPENAI_MODEL,
				"messages": [
					{"role": "system", "content": "You are a helpful, natural-sounding phone sales assistant."},
					{"role": "user", "content": prompt},
				],
			},
		)
		resp.raise_for_status()
		data = resp.json()
		return data.get("choices", [{}])[0].get("message", {}).get("content", "")
