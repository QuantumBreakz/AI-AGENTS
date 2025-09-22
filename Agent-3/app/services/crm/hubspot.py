import os
from typing import Mapping, Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings

BASE_URL = "https://api.hubapi.com"

class HubSpotClient:
	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def upsert_contact(self, email: str, properties: Mapping[str, Any]) -> None:
		api_key = settings.HUBSPOT_API_KEY
		if not api_key:
			return
		async with httpx.AsyncClient(timeout=30) as client:
			payload = {"properties": [{"property": k, "value": v} for k, v in properties.items() if v is not None]}
			await client.post(
				f"{BASE_URL}/contacts/v1/contact/createOrUpdate/email/{email}",
				params={"hapikey": api_key},
				json=payload,
			)

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def add_note(self, email: str, note: str) -> None:
		api_key = settings.HUBSPOT_API_KEY
		if not api_key:
			return
		# Simplified; real impl would fetch contact ID and create engagement
		return

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def update_stage(self, email: str, stage: str) -> None:
		api_key = settings.HUBSPOT_API_KEY
		if not api_key:
			return
		await self.upsert_contact(email, {"lifecyclestage": stage})
