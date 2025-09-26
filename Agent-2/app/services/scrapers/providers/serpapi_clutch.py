from typing import Mapping, Any, AsyncIterator, List

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings
from httpx import HTTPStatusError
import logging
logger = logging.getLogger(__name__)

API_KEY = settings.SERPAPI_API_KEY
BASE_URL = "https://serpapi.com/search.json"
DDG_URL = "https://duckduckgo.com/html/"

class SerpapiClutchScraper:
	name = "clutch"

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
	async def search(self, query: Mapping[str, Any]) -> AsyncIterator[Mapping[str, Any]]:
		async with httpx.AsyncClient(timeout=30, headers={"User-Agent": "Mozilla/5.0"}) as client:
			data: dict | None = None
			if API_KEY:
				try:
					params = {
						"engine": "google",
						"q": f"site:clutch.co {query.get('industry','')} {query.get('location','')}",
						"api_key": API_KEY,
					}
					resp = await client.get(BASE_URL, params=params)
					resp.raise_for_status()
					data = resp.json()
				except Exception:
					logger.debug("serpapi_clutch_search_failed", exc_info=True)
			# Fallback to DuckDuckGo HTML scraping if SerpAPI is not available
			if data is None:
				try:
					q = f"site:clutch.co {query.get('industry','')} {query.get('location','')}"
					resp = await client.get(DDG_URL, params={"q": q})
					resp.raise_for_status()
					html = resp.text
					companies: List[str] = []
					for line in html.splitlines():
						if "result__a" in line and "clutch.co" in line:
							import re
							m = re.search(r">([^<]{2,120})<", line)
							if m:
								companies.append(m.group(1))
					dat_results = [{"title": c} for c in companies[:20]]
				except Exception:
					logger.debug("ddg_clutch_fallback_failed", exc_info=True)
					dat_results = []
			else:
				dat_results = data.get("organic_results", [])
			for item in dat_results[:20]:
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
