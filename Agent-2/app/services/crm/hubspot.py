from typing import Mapping, Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
logger = logging.getLogger(__name__)
from app.core.config import settings
from httpx import HTTPStatusError

API_KEY = settings.HUBSPOT_API_KEY
BASE_URL = "https://api.hubapi.com"

class HubSpotClient:
	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def upsert_contact(self, email: str, properties: Mapping[str, Any]) -> None:
		if not API_KEY:
			return
		try:
			async with httpx.AsyncClient(timeout=30) as client:
				payload = {"properties": [{"property": k, "value": v} for k, v in properties.items() if v is not None]}
				await client.post(
					f"{BASE_URL}/contacts/v1/contact/createOrUpdate/email/{email}",
					params={"hapikey": API_KEY},
					json=payload,
				)
		except HTTPStatusError as e:
			status = e.response.status_code if e.response else None
			url = str(e.request.url) if e.request else None
			logger.warning("hubspot_upsert_failed status=%s url=%s", status, url)
			return
		except Exception:
			logger.exception("hubspot_upsert_failed_unexpected")
			return

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def add_note(self, email: str, note: str) -> None:
		if not API_KEY:
			return
		try:
			async with httpx.AsyncClient(timeout=30) as client:
				resp = await client.get(
					f"{BASE_URL}/contacts/v1/contact/email/{email}/profile",
					params={"hapikey": API_KEY},
				)
				if resp.status_code == 404:
					await self.upsert_contact(email, {"email": email})
					resp = await client.get(
						f"{BASE_URL}/contacts/v1/contact/email/{email}/profile",
						params={"hapikey": API_KEY},
					)
				resp.raise_for_status()
				vid = resp.json().get("vid")
				if not vid:
					return
				payload = {
					"engagement": {"active": True, "type": "NOTE"},
					"associations": {"contactIds": [vid]},
					"metadata": {"body": note},
				}
				await client.post(
					f"{BASE_URL}/engagements/v1/engagements",
					params={"hapikey": API_KEY},
					json=payload,
				)
		except HTTPStatusError as e:
			status = e.response.status_code if e.response else None
			url = str(e.request.url) if e.request else None
			logger.warning("hubspot_add_note_failed status=%s url=%s", status, url)
			return
		except Exception:
			logger.exception("hubspot_add_note_failed_unexpected")
			return

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def update_stage(self, email: str, stage: str) -> None:
		if not API_KEY:
			return
		await self.upsert_contact(email, {"lifecyclestage": stage})
