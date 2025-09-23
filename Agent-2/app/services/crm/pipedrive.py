from typing import Mapping, Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
logger = logging.getLogger(__name__)
from app.core.config import settings
from httpx import HTTPStatusError

API_TOKEN = settings.PIPEDRIVE_API_TOKEN or settings.PIPEDRIVE_API_KEY
BASE_URL = "https://api.pipedrive.com/v1"

class PipedriveClient:
	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def upsert_contact(self, email: str, properties: Mapping[str, Any]) -> None:
		if not API_TOKEN:
			return
		async with httpx.AsyncClient(timeout=30) as client:
			try:
				res = await client.get(f"{BASE_URL}/persons/search", params={"api_token": API_TOKEN, "term": email, "fields": "email"})
				data = res.json() if res.status_code == 200 else {}
			except HTTPStatusError as e:
				status = e.response.status_code if e.response else None
				url = str(e.request.url) if e.request else None
				logger.warning("pipedrive_upsert_lookup_failed status=%s url=%s", status, url)
				return
			except Exception:
				logger.exception("pipedrive_upsert_lookup_failed_unexpected")
				return
			items = (data.get("data") or {}).get("items") or []
			person_id = None
			for it in items:
				person = (it.get("item") or {})
				if person.get("type") == "person":
					person_id = person.get("id")
					break
			payload = {"name": properties.get("name") or email, "email": email, **{k: v for k, v in properties.items() if v is not None}}
			if person_id:
				await client.put(f"{BASE_URL}/persons/{person_id}", params={"api_token": API_TOKEN}, json=payload)
			else:
				await client.post(f"{BASE_URL}/persons", params={"api_token": API_TOKEN}, json=payload)

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def add_note(self, email: str, note: str) -> None:
		if not API_TOKEN:
			return
		async with httpx.AsyncClient(timeout=30) as client:
			try:
				res = await client.get(f"{BASE_URL}/persons/search", params={"api_token": API_TOKEN, "term": email, "fields": "email"})
				res.raise_for_status()
			except HTTPStatusError as e:
				status = e.response.status_code if e.response else None
				url = str(e.request.url) if e.request else None
				logger.warning("pipedrive_add_note_lookup_failed status=%s url=%s", status, url)
				return
			except Exception:
				logger.exception("pipedrive_add_note_lookup_failed_unexpected")
				return
			items = ((res.json().get("data") or {}).get("items") or [])
			person_id = None
			for it in items:
				person = (it.get("item") or {})
				if person.get("type") == "person":
					person_id = person.get("id")
					break
			if not person_id:
				return
			await client.post(f"{BASE_URL}/notes", params={"api_token": API_TOKEN}, json={"content": note, "person_id": person_id})

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def update_stage(self, email: str, stage: str) -> None:
		if not API_TOKEN:
			return
		async with httpx.AsyncClient(timeout=30) as client:
			try:
				res = await client.get(f"{BASE_URL}/persons/search", params={"api_token": API_TOKEN, "term": email, "fields": "email"})
				res.raise_for_status()
			except HTTPStatusError as e:
				status = e.response.status_code if e.response else None
				url = str(e.request.url) if e.request else None
				logger.warning("pipedrive_update_stage_lookup_failed status=%s url=%s", status, url)
				return
			except Exception:
				logger.exception("pipedrive_update_stage_lookup_failed_unexpected")
				return
			items = ((res.json().get("data") or {}).get("items") or [])
			person_id = None
			for it in items:
				person = (it.get("item") or {})
				if person.get("type") == "person":
					person_id = person.get("id")
					break
			if not person_id:
				return
			await client.put(f"{BASE_URL}/persons/{person_id}", params={"api_token": API_TOKEN}, json={"label": stage})
