from typing import Protocol, Iterable, Mapping, Any

class Scraper(Protocol):
	name: str
	async def search(self, query: Mapping[str, Any]) -> Iterable[Mapping[str, Any]]:  # pragma: no cover
		...
