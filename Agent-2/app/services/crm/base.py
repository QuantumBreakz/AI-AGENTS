from typing import Protocol, Optional, Mapping, Any

class CRMService(Protocol):
	async def upsert_contact(self, email: str, properties: Mapping[str, Any]) -> None:  # pragma: no cover
		...

	async def update_stage(self, email: str, stage: str) -> None:  # pragma: no cover
		...

	async def add_note(self, email: str, note: str) -> None:  # pragma: no cover
		...
