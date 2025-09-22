import os
from typing import Mapping, Any, AsyncIterator

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

API_KEY = os.getenv("CRUNCHBASE_API_KEY")
BASE_URL = "https://api.crunchbase.com/api/v4"

class CrunchbaseScraper:
	name = "crunchbase"

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
	async def search(self, query: Mapping[str, Any]) -> AsyncIterator[Mapping[str, Any]]:
		if not API_KEY:
			return
		# Company search then enrich people is rate-limited; here return company-level leads
		params = {
			"user_key": API_KEY,
			"locations": query.get("location"),
			"categories": query.get("industry"),
		}
		async with httpx.AsyncClient(timeout=30) as client:
			resp = await client.get(f"{BASE_URL}/searches/organizations", params={k: v for k, v in params.items() if v})
			resp.raise_for_status()
			data = resp.json()
			for org in (data.get("entities") or [])[:50]:
				props = org.get("properties", {})
				yield {
					"name": None,
					"email": None,
					"company": props.get("name"),
					"role": query.get("role"),
					"linkedin_url": None,
					"source": self.name,
					"company_size": props.get("num_employees_enum"),
					"industry": props.get("category_list"),
					"location": props.get("location_identifiers"),
				}
