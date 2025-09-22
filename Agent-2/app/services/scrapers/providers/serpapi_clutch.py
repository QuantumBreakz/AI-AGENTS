import os
from typing import Mapping, Any, AsyncIterator

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

API_KEY = os.getenv("SERPAPI_API_KEY")
BASE_URL = "https://serpapi.com/search.json"

class SerpapiClutchScraper:
	name = "clutch"

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
	async def search(self, query: Mapping[str, Any]) -> AsyncIterator[Mapping[str, Any]]:
		if not API_KEY:
			return
		params = {
			"engine": "google",
			"q": f"site:clutch.co {query.get('industry','')} {query.get('location','')}",
			"api_key": API_KEY,
		}
		async with httpx.AsyncClient(timeout=30) as client:
			resp = await client.get(BASE_URL, params=params)
			resp.raise_for_status()
			data = resp.json()
			for item in data.get("organic_results", [])[:20]:
				company = item.get("title")
				yield {
					"name": None,
					"email": None,
					"company": company,
					"role": query.get("role"),
					"linkedin_url": None,
					"source": self.name,
					"company_size": None,
					"industry": query.get("industry"),
					"location": query.get("location"),
				}
