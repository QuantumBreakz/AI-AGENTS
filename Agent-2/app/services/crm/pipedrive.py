import os
from typing import Mapping, Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

API_TOKEN = os.getenv("PIPEDRIVE_API_TOKEN")
BASE_URL = "https://api.pipedrive.com/v1"

class PipedriveClient:
	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def upsert_contact(self, email: str, properties: Mapping[str, Any]) -> None:
		if not API_TOKEN:
			return
		async with httpx.AsyncClient(timeout=30) as client:
			# Try to find existing person by email
			res = await client.get(f"{BASE_URL}/persons/search", params={"api_token": API_TOKEN, "term": email, "fields": "email"})
			data = res.json() if res.status_code == 200 else {}
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
			# Find person by email
			res = await client.get(f"{BASE_URL}/persons/search", params={"api_token": API_TOKEN, "term": email, "fields": "email"})
			res.raise_for_status()
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
		# Pipedrive uses deals for stages; here we attach stage as a person label if no deal
		async with httpx.AsyncClient(timeout=30) as client:
			res = await client.get(f"{BASE_URL}/persons/search", params={"api_token": API_TOKEN, "term": email, "fields": "email"})
			res.raise_for_status()
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
