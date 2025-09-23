from typing import Mapping, Any, AsyncIterator

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings
from httpx import HTTPStatusError
import logging
logger = logging.getLogger(__name__)

API_KEY = settings.SERPAPI_API_KEY
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
			try:
				resp = await client.get(BASE_URL, params=params)
				resp.raise_for_status()
				data = resp.json()
			except HTTPStatusError as e:
				status = e.response.status_code if e.response else None
				url = str(e.request.url) if e.request else None
				logger.debug("serpapi_clutch_search_failed status=%s url=%s", status, url)
				return
			except Exception:
				logger.debug("serpapi_clutch_search_failed_unexpected", exc_info=True)
				return
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
