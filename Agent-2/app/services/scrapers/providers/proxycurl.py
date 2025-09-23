from typing import Mapping, Any, AsyncIterator

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings
from httpx import HTTPStatusError
import logging
logger = logging.getLogger(__name__)

API_KEY = settings.PROXYCURL_API_KEY
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
			try:
				resp = await client.get(f"{BASE_URL}/search/person", headers=headers, params={k: v for k, v in params.items() if v})
				resp.raise_for_status()
				data = resp.json()
			except HTTPStatusError as e:
				status = e.response.status_code if e.response else None
				url = str(e.request.url) if e.request else None
				logger.debug("proxycurl_search_failed status=%s url=%s", status, url)
				return
			except Exception:
				logger.debug("proxycurl_search_failed_unexpected", exc_info=True)
				return
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
