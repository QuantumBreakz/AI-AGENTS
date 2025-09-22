import os
from typing import Mapping, Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

CLIENT_ID = os.getenv("SALESFORCE_CLIENT_ID")
CLIENT_SECRET = os.getenv("SALESFORCE_CLIENT_SECRET")
USERNAME = os.getenv("SALESFORCE_USERNAME")
PASSWORD = os.getenv("SALESFORCE_PASSWORD")
TOKEN = os.getenv("SALESFORCE_TOKEN")

API_VERSION = "v59.0"

class SalesforceClient:
	async def _get_token(self) -> tuple[str | None, str | None]:
		if not (CLIENT_ID and CLIENT_SECRET and USERNAME and PASSWORD and TOKEN):
			return None, None
		async with httpx.AsyncClient(timeout=30) as client:
			resp = await client.post(
				"https://login.salesforce.com/services/oauth2/token",
				data={
					"grant_type": "password",
					"client_id": CLIENT_ID,
					"client_secret": CLIENT_SECRET,
					"username": USERNAME,
					"password": PASSWORD + TOKEN,
				},
			)
			resp.raise_for_status()
			data = resp.json()
			return data.get("access_token"), data.get("instance_url")

	async def _find_contact(self, token: str, instance_url: str, email: str) -> str | None:
		query = f"SELECT Id FROM Contact WHERE Email = '{email}' LIMIT 1"
		async with httpx.AsyncClient(timeout=30) as client:
			resp = await client.get(
				f"{instance_url}/services/data/{API_VERSION}/query",
				params={"q": query},
				headers={"Authorization": f"Bearer {token}"},
			)
			resp.raise_for_status()
			records = resp.json().get("records", [])
			return records[0]["Id"] if records else None

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def upsert_contact(self, email: str, properties: Mapping[str, Any]) -> None:
		token, base = await self._get_token()
		if not token or not base:
			return
		contact_id = await self._find_contact(token, base, email)
		payload = {"Email": email}
		# Map generic properties to common Contact fields when possible
		if properties.get("name"):
			payload["LastName"] = properties["name"]
		if properties.get("company"):
			payload["AccountName"] = properties["company"]
		async with httpx.AsyncClient(timeout=30, headers={"Authorization": f"Bearer {token}"}) as client:
			if contact_id:
				await client.patch(f"{base}/services/data/{API_VERSION}/sobjects/Contact/{contact_id}", json=payload)
			else:
				# LastName is required for Contact
				if "LastName" not in payload:
					payload["LastName"] = email.split("@")[0]
				await client.post(f"{base}/services/data/{API_VERSION}/sobjects/Contact", json=payload)

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def add_note(self, email: str, note: str) -> None:
		token, base = await self._get_token()
		if not token or not base:
			return
		contact_id = await self._find_contact(token, base, email)
		if not contact_id:
			await self.upsert_contact(email, {"name": email.split("@")[0]})
			contact_id = await self._find_contact(token, base, email)
		if not contact_id:
			return
		# Create a Task as a note linked to Contact
		payload = {
			"Subject": "Call Note",
			"Description": note,
			"WhoId": contact_id,
		}
		async with httpx.AsyncClient(timeout=30, headers={"Authorization": f"Bearer {token}"}) as client:
			await client.post(f"{base}/services/data/{API_VERSION}/sobjects/Task", json=payload)

	@retry(stop=stop_after_attempt(3), wait=wait_exponential())
	async def update_stage(self, email: str, stage: str) -> None:
		token, base = await self._get_token()
		if not token or not base:
			return
		contact_id = await self._find_contact(token, base, email)
		if not contact_id:
			await self.upsert_contact(email, {"name": email.split("@")[0]})
			contact_id = await self._find_contact(token, base, email)
		if not contact_id:
			return
		# Record stage as a Task to avoid custom schema requirements
		payload = {
			"Subject": f"Stage Update: {stage}",
			"Description": f"Updated stage to: {stage}",
			"WhoId": contact_id,
		}
		async with httpx.AsyncClient(timeout=30, headers={"Authorization": f"Bearer {token}"}) as client:
			await client.post(f"{base}/services/data/{API_VERSION}/sobjects/Task", json=payload)
