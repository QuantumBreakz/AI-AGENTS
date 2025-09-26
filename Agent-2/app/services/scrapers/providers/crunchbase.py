from typing import Mapping, Any, AsyncIterator, List

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings
from httpx import HTTPStatusError
import logging
logger = logging.getLogger(__name__)

API_KEY = settings.CRUNCHBASE_API_KEY
BASE_URL = "https://api.crunchbase.com/api/v4"
DDG_URL = "https://duckduckgo.com/html/"

class CrunchbaseScraper:
	name = "crunchbase"

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
	async def search(self, query: Mapping[str, Any]) -> AsyncIterator[Mapping[str, Any]]:
		# Prefer API; gracefully fallback to web search if unavailable
		async with httpx.AsyncClient(timeout=30, headers={"User-Agent": "Mozilla/5.0"}) as client:
			api_worked = False
			if API_KEY:
				try:
					# Crunchbase v4 search typically expects POST with a body; use a permissive request
					params = {"user_key": API_KEY}
					body = {
						"field_ids": ["identifier", "name", "categories", "rank_org", "num_employees_enum", "location_identifiers"],
						"limit": 20,
						"order": [{"field_id": "rank_org", "sort": "asc"}],
						"query": {"type": "predicate", "field_id": "entity_types", "operator_id": "includes", "values": ["organization"]},
					}
					resp = await client.post(f"{BASE_URL}/searches/organizations", params=params, json=body)
					resp.raise_for_status()
					data = resp.json()
					for org in (data.get("entities") or [])[:50]:
						props = org.get("properties", {})
						# Optional filter by industry and location
						if query.get("industry") and query.get("industry").lower() not in str(props.get("categories", "")).lower():
							continue
						if query.get("location") and query.get("location").lower() not in str(props.get("location_identifiers", "")).lower():
							continue
						yield {
							"name": None,
							"email": None,
							"company": props.get("name") or props.get("identifier"),
							"role": query.get("role"),
							"linkedin_url": None,
							"source": self.name,
							"company_size": props.get("num_employees_enum"),
							"industry": props.get("categories"),
							"location": props.get("location_identifiers"),
						}
					api_worked = True
				except Exception:
					logger.debug("crunchbase_api_search_failed", exc_info=True)
			# Web fallback via DuckDuckGo if API didn't work or returned nothing
			if not api_worked:
				try:
					terms = ["site:crunchbase.com", query.get("industry") or "", query.get("location") or ""]
					q = " ".join([t for t in terms if t]).strip()
					resp = await client.get(DDG_URL, params={"q": q})
					resp.raise_for_status()
					html = resp.text
					companies: List[str] = []
					for line in html.splitlines():
						if "result__a" in line and "crunchbase.com" in line:
							import re
							m = re.search(r">([^<]{2,120})<", line)
							if m:
								companies.append(m.group(1))
					for company in companies[:20]:
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
				except Exception:
					logger.debug("crunchbase_ddg_fallback_failed", exc_info=True)
					return
