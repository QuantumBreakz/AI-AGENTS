import os
from typing import Mapping, Any, AsyncIterator

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

API_KEY = os.getenv("PROXYCURL_API_KEY")
BASE_URL = "https://nubela.co/proxycurl/api"

class ProxycurlLinkedInScraper:
	name = "linkedin"

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
	async def search(self, query: Mapping[str, Any]) -> AsyncIterator[Mapping[str, Any]]:
		if not API_KEY:
			return
		headers = {"Authorization": f"Bearer {API_KEY}"}
		params = {
			"title": query.get("role"),
			"country": query.get("location"),
			"current_company_num_employees_min": None,
			"industry": query.get("industry"),
		}
		async with httpx.AsyncClient(timeout=30) as client:
			resp = await client.get(f"{BASE_URL}/search/person", headers=headers, params={k: v for k, v in params.items() if v})
			resp.raise_for_status()
			data = resp.json()
			for p in data.get("results", [])[:50]:
				yield {
					"name": p.get("full_name"),
					"email": None,
					"company": (p.get("current_company") or {}).get("name"),
					"role": p.get("occupation"),
					"linkedin_url": p.get("linkedin_profile_url"),
					"source": self.name,
					"company_size": None,
					"industry": query.get("industry"),
					"location": p.get("country_full_name") or query.get("location"),
				}
