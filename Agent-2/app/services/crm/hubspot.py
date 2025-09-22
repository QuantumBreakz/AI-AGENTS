import os
from typing import Mapping, Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

API_KEY = os.getenv("HUBSPOT_API_KEY")
BASE_URL = "https://api.hubapi.com"

class HubSpotClient:
	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def upsert_contact(self, email: str, properties: Mapping[str, Any]) -> None:
		if not API_KEY:
			return
		async with httpx.AsyncClient(timeout=30) as client:
			payload = {"properties": [{"property": k, "value": v} for k, v in properties.items() if v is not None]}
			await client.post(
				f"{BASE_URL}/contacts/v1/contact/createOrUpdate/email/{email}",
				params={"hapikey": API_KEY},
				json=payload,
			)

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def add_note(self, email: str, note: str) -> None:
		if not API_KEY:
			return
		async with httpx.AsyncClient(timeout=30) as client:
			# 1) Lookup contact VID by email
			resp = await client.get(
				f"{BASE_URL}/contacts/v1/contact/email/{email}/profile",
				params={"hapikey": API_KEY},
			)
			if resp.status_code == 404:
				# create minimal contact first
				await self.upsert_contact(email, {"email": email})
				resp = await client.get(
					f"{BASE_URL}/contacts/v1/contact/email/{email}/profile",
					params={"hapikey": API_KEY},
				)
			resp.raise_for_status()
			vid = resp.json().get("vid")
			if not vid:
				return
			# 2) Create NOTE engagement associated with contact
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

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def update_stage(self, email: str, stage: str) -> None:
		if not API_KEY:
			return
		await self.upsert_contact(email, {"lifecyclestage": stage})
