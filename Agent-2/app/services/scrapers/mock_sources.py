from typing import Iterable, Mapping, Any, List

from app.services.scrapers.base import Scraper

class BaseMockScraper:
	name: str
	def __init__(self, name: str):
		self.name = name
	async def search(self, query: Mapping[str, Any]) -> Iterable[Mapping[str, Any]]:
		# Return dummy leads
		return [
			{
				"name": "Jane Doe",
				"email": "jane@example.com",
				"company": "Example Co",
				"role": query.get("role") or "CTO",
				"linkedin_url": "https://www.linkedin.com/in/janedoe",
				"source": self.name,
				"company_size": query.get("company_size"),
				"industry": query.get("industry"),
				"location": query.get("location"),
			}
		]

LinkedInScraper: Scraper = BaseMockScraper("linkedin")
ApolloScraper: Scraper = BaseMockScraper("apollo")
CrunchbaseScraper: Scraper = BaseMockScraper("crunchbase")
ClutchScraper: Scraper = BaseMockScraper("clutch")
