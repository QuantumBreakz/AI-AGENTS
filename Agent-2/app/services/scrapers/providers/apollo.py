from typing import Mapping, Any, AsyncIterator

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings
from httpx import HTTPStatusError
import logging
logger = logging.getLogger(__name__)

API_KEY = settings.APOLLO_API_KEY
BASE_URL = "https://api.apollo.io/v1"

class ApolloScraper:
	name = "apollo"

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
	async def search(self, query: Mapping[str, Any]) -> AsyncIterator[Mapping[str, Any]]:
		if not API_KEY:
			return
		
		# Try the people search endpoint first (available on free plan)
		payload = {
			"person_titles": [query.get("role")] if query.get("role") else None,
			"person_locations": [query.get("location")] if query.get("location") else None,
			"organization_industries": [query.get("industry")] if query.get("industry") else None,
			"page": 1,
			"per_page": 20,
		}
		
		async with httpx.AsyncClient(timeout=30) as client:
			try:
				# Try people search endpoint (free plan)
				resp = await client.post(
					f"{BASE_URL}/people/search",
					headers={"Cache-Control": "no-cache", "Content-Type": "application/json", "X-Api-Key": API_KEY},
					json={k: v for k, v in payload.items() if v},
				)
				resp.raise_for_status()
				data = resp.json()
				for p in data.get("people", [])[:50]:
					yield {
						"name": f"{p.get('first_name','')} {p.get('last_name','')}".strip(),
						"email": p.get("email") or p.get("email_status"),
						"company": (p.get("organization") or {}).get("name"),
						"role": p.get("title"),
						"linkedin_url": p.get("linkedin_url"),
						"source": self.name,
						"company_size": (p.get("organization") or {}).get("estimated_num_employees"),
						"industry": (p.get("organization") or {}).get("industry"),
						"location": p.get("city") or p.get("country") or query.get("location"),
					}
			except HTTPStatusError as e:
				status = e.response.status_code if e.response else None
				url = str(e.request.url) if e.request else None
				logger.debug("apollo_search_failed status=%s url=%s", status, url)
				
				# If people search fails, try organizations search
				try:
					org_payload = {
						"organization_industries": [query.get("industry")] if query.get("industry") else None,
						"organization_locations": [query.get("location")] if query.get("location") else None,
						"page": 1,
						"per_page": 20,
					}
					resp = await client.post(
						f"{BASE_URL}/organizations/search",
						headers={"Cache-Control": "no-cache", "Content-Type": "application/json", "X-Api-Key": API_KEY},
						json={k: v for k, v in org_payload.items() if v},
					)
					resp.raise_for_status()
					data = resp.json()
					for org in data.get("organizations", [])[:50]:
						yield {
							"name": None,
							"email": None,
							"company": org.get("name"),
							"role": query.get("role"),
							"linkedin_url": org.get("linkedin_url"),
							"source": self.name,
							"company_size": org.get("estimated_num_employees"),
							"industry": org.get("industry"),
							"location": org.get("city") or org.get("country") or query.get("location"),
						}
				except HTTPStatusError as e2:
					logger.debug("apollo_org_search_failed status=%s url=%s", e2.response.status_code if e2.response else None, str(e2.request.url) if e2.request else None)
					return
				except Exception:
					logger.debug("apollo_org_search_failed_unexpected", exc_info=True)
					return
			except Exception:
				logger.debug("apollo_search_failed_unexpected", exc_info=True)
				return
