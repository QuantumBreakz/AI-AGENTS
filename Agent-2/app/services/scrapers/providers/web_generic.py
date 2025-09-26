from typing import Mapping, Any, AsyncIterator, List

import httpx
import re
import urllib.parse
from tenacity import retry, stop_after_attempt, wait_exponential


DDG_URL = "https://duckduckgo.com/html/"
DDG_ALT = "https://r.jina.ai/http://duckduckgo.com/html/"


class WebGenericScraper:
	name = "web"

	@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
	async def search(self, query: Mapping[str, Any]) -> AsyncIterator[Mapping[str, Any]]:
		# Use DuckDuckGo HTML to find public pages that may include company names and contacts
		terms = []
		if query.get("industry"):
			terms.append(query.get("industry"))
		if query.get("role"):
			terms.append(query.get("\"" + query.get("role") + "\""))
		if query.get("location"):
			terms.append(query.get("location"))
		# Prefer LinkedIn or company sites
		terms.append("(site:linkedin.com OR site:about.me OR site:crunchbase.com OR site:clutch.co)")
		q = " ".join(terms)
		async with httpx.AsyncClient(timeout=30, headers={"User-Agent": "Mozilla/5.0"}) as client:
			try:
				resp = await client.get(DDG_URL, params={"q": q})
				resp.raise_for_status()
				html = resp.text
			except Exception:
				# Try text proxy mirror which returns extracted text for easier parsing
				resp = await client.get(DDG_ALT, params={"q": q})
				resp.raise_for_status()
				html = resp.text
			links: List[str] = []
			for line in html.splitlines():
				if "result__a" in line:
					m = re.search(r"href=\"([^\"]+)\"", line)
					if m:
						url = m.group(1)
						url = urllib.parse.unquote(url)
						links.append(url)
			for url in links[:25]:
				# Heuristic extraction of company from URL path
				company = None
				if "linkedin.com" in url:
					m = re.search(r"linkedin.com/(company|in)/([^/?#]+)", url)
					if m:
						company = m.group(2).replace("-", " ")
				yield {
					"name": None,
					"email": None,
					"company": company,
					"role": query.get("role"),
					"linkedin_url": url if "linkedin.com" in url else None,
					"source": self.name,
					"company_size": None,
					"industry": query.get("industry"),
					"location": query.get("location"),
			}

