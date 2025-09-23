from typing import Mapping, Any, AsyncIterator

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings
from httpx import HTTPStatusError
import logging
logger = logging.getLogger(__name__)

API_KEY = settings.CRUNCHBASE_API_KEY
BASE_URL = "https://api.crunchbase.com/api/v4"

class CrunchbaseScraper:
	name = "crunchbase"

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
	async def search(self, query: Mapping[str, Any]) -> AsyncIterator[Mapping[str, Any]]:
		if not API_KEY:
			return
		
		# Try different Crunchbase endpoints
		async with httpx.AsyncClient(timeout=30) as client:
			try:
				# Try the basic organizations endpoint first
				params = {
					"user_key": API_KEY,
					"limit": 20,
				}
				resp = await client.get(f"{BASE_URL}/searches/organizations", params=params)
				resp.raise_for_status()
				data = resp.json()
				
				for org in (data.get("entities") or [])[:50]:
					props = org.get("properties", {})
					# Filter by industry if specified
					if query.get("industry") and query.get("industry").lower() not in str(props.get("category_list", "")).lower():
						continue
					# Filter by location if specified  
					if query.get("location") and query.get("location").lower() not in str(props.get("location_identifiers", "")).lower():
						continue
					
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
			except HTTPStatusError as e:
				status = e.response.status_code if e.response else None
				url = str(e.request.url) if e.request else None
				logger.debug("crunchbase_search_failed status=%s url=%s", status, url)
				
				# If search fails, try a simple organizations list
				try:
					resp = await client.get(f"{BASE_URL}/organizations", params={"user_key": API_KEY, "limit": 20})
					resp.raise_for_status()
					data = resp.json()
					
					for org in (data.get("entities") or [])[:20]:
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
				except HTTPStatusError as e2:
					logger.debug("crunchbase_org_list_failed status=%s url=%s", e2.response.status_code if e2.response else None, str(e2.request.url) if e2.request else None)
					return
				except Exception:
					logger.debug("crunchbase_org_list_failed_unexpected", exc_info=True)
					return
			except Exception:
				logger.debug("crunchbase_search_failed_unexpected", exc_info=True)
				return
