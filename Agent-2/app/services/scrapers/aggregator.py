from typing import Mapping, Any, Iterable, List, Dict, Set

from app.services.scrapers.providers.apollo import ApolloScraper
from app.services.scrapers.providers.crunchbase import CrunchbaseScraper
from app.services.scrapers.providers.proxycurl import ProxycurlLinkedInScraper
from app.services.scrapers.providers.serpapi_clutch import SerpapiClutchScraper
from app.core.config import settings

NORMALIZED_FIELDS = ["name", "email", "company", "role", "linkedin_url", "source", "company_size", "industry", "location"]

def normalize(record: Mapping[str, Any]) -> Dict[str, Any]:
	out = {k: record.get(k) for k in NORMALIZED_FIELDS}
	return out

async def aggregate_search(query: Mapping[str, Any], providers: List[str] | None = None) -> List[Dict[str, Any]]:
	provider_map = {
		"apollo": ApolloScraper(),
		"crunchbase": CrunchbaseScraper(),
		"linkedin": ProxycurlLinkedInScraper(),
		"clutch": SerpapiClutchScraper(),
	}
	configured = set(filter(None, (settings.ENABLED_SCRAPERS or "").lower().split(",")))
	default_set = list(configured) if configured else []
	selected = providers if providers is not None else default_set
	if not selected:
		return []
	results: List[Dict[str, Any]] = []
	seen: Set[str] = set()
	for name in selected:
		scraper = provider_map.get(name)
		if not scraper:
			continue
		async for rec in scraper.search(query):
			n = normalize(rec)
			key = (n.get("email") or "").lower() or (n.get("linkedin_url") or "").lower()
			if not key or key in seen:
				continue
			seen.add(key)
			results.append(n)
	return results
