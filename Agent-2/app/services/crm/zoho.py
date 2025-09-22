import os
from typing import Mapping, Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

ACCESS_TOKEN = os.getenv("ZOHO_ACCESS_TOKEN")
BASE_URL = "https://www.zohoapis.com/crm/v3"

class ZohoClient:
	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def upsert_contact(self, email: str, properties: Mapping[str, Any]) -> None:
		if not ACCESS_TOKEN:
			return
		payload = {
			"data": [
				{
					"Email": email,
					"Last_Name": (properties.get("name") or email.split("@")[0])[:80],
					"Description": properties.get("company") or None,
				}
			],
			"trigger": ["workflow"],
		}
		async with httpx.AsyncClient(timeout=30, headers={"Authorization": f"Zoho-oauthtoken {ACCESS_TOKEN}"}) as client:
			await client.post(f"{BASE_URL}/Contacts/upsert", json=payload)

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def add_note(self, email: str, note: str) -> None:
		if not ACCESS_TOKEN:
			return
		contact_id = await self._find_contact(email)
		if not contact_id:
			await self.upsert_contact(email, {})
			contact_id = await self._find_contact(email)
		if not contact_id:
			return
		payload = {"data": [{"Note_Title": "Call Note", "Note_Content": note, "Parent_Id": contact_id, "se_module": "Contacts"}]}
		async with httpx.AsyncClient(timeout=30, headers={"Authorization": f"Zoho-oauthtoken {ACCESS_TOKEN}"}) as client:
			await client.post(f"{BASE_URL}/Notes", json=payload)

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def update_stage(self, email: str, stage: str) -> None:
		if not ACCESS_TOKEN:
			return
		contact_id = await self._find_contact(email)
		if not contact_id:
			await self.upsert_contact(email, {})
			contact_id = await self._find_contact(email)
		if not contact_id:
			return
		payload = {"data": [{"id": contact_id, "Description": f"Stage: {stage}"}]}
		async with httpx.AsyncClient(timeout=30, headers={"Authorization": f"Zoho-oauthtoken {ACCESS_TOKEN}"}) as client:
			await client.put(f"{BASE_URL}/Contacts", json=payload)

	async def _find_contact(self, email: str) -> str | None:
		if not ACCESS_TOKEN:
			return None
		async with httpx.AsyncClient(timeout=30, headers={"Authorization": f"Zoho-oauthtoken {ACCESS_TOKEN}"}) as client:
			resp = await client.get(f"{BASE_URL}/Contacts/search", params={"email": email})
			if resp.status_code == 204:
				return None
			resp.raise_for_status()
			data = resp.json()
			recs = (data.get("data") or [])
			return (recs[0] or {}).get("id") if recs else None
