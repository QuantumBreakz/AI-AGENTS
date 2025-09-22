import os
from typing import Literal, Mapping, Any

import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

async def suggest(kind: Literal["reply","rebuttal","pricing","pitch"], context: Mapping[str, Any]) -> str:
	if not OPENAI_API_KEY:
		return ""
	prompt = f"Generate a concise {kind} based on context: {context}"
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
