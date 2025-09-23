from typing import Mapping, Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
logger = logging.getLogger(__name__)
from app.core.config import settings
from httpx import HTTPStatusError

ACCESS_TOKEN = settings.ZOHO_ACCESS_TOKEN or settings.ZOHO_API_KEY
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
		try:
			async with httpx.AsyncClient(timeout=30, headers={"Authorization": f"Zoho-oauthtoken {ACCESS_TOKEN}"}) as client:
				await client.post(f"{BASE_URL}/Contacts/upsert", json=payload)
		except HTTPStatusError as e:
			status = e.response.status_code if e.response else None
			url = str(e.request.url) if e.request else None
			logger.warning("zoho_upsert_failed status=%s url=%s", status, url)
			return
		except Exception:
			logger.exception("zoho_upsert_failed_unexpected")
			return

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
		try:
			async with httpx.AsyncClient(timeout=30, headers={"Authorization": f"Zoho-oauthtoken {ACCESS_TOKEN}"}) as client:
				await client.post(f"{BASE_URL}/Notes", json=payload)
		except HTTPStatusError as e:
			status = e.response.status_code if e.response else None
			url = str(e.request.url) if e.request else None
			logger.warning("zoho_add_note_failed status=%s url=%s", status, url)
			return
		except Exception:
			logger.exception("zoho_add_note_failed_unexpected")
			return

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
		try:
			async with httpx.AsyncClient(timeout=30, headers={"Authorization": f"Zoho-oauthtoken {ACCESS_TOKEN}"}) as client:
				await client.put(f"{BASE_URL}/Contacts", json=payload)
		except HTTPStatusError as e:
			status = e.response.status_code if e.response else None
			url = str(e.request.url) if e.request else None
			logger.warning("zoho_update_stage_failed status=%s url=%s", status, url)
			return
		except Exception:
			logger.exception("zoho_update_stage_failed_unexpected")
			return

	async def _find_contact(self, email: str) -> str | None:
		if not ACCESS_TOKEN:
			return None
		try:
			async with httpx.AsyncClient(timeout=30, headers={"Authorization": f"Zoho-oauthtoken {ACCESS_TOKEN}"}) as client:
				resp = await client.get(f"{BASE_URL}/Contacts/search", params={"email": email})
				if resp.status_code == 204:
					return None
				resp.raise_for_status()
				data = resp.json()
		except HTTPStatusError as e:
			status = e.response.status_code if e.response else None
			url = str(e.request.url) if e.request else None
			logger.warning("zoho_find_contact_failed status=%s url=%s", status, url)
			return None
		except Exception:
			logger.exception("zoho_find_contact_failed_unexpected")
			return None
		recs = (data.get("data") or [])
		return (recs[0] or {}).get("id") if recs else None
