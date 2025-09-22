from typing import Mapping, Any

from app.core.config import settings
from app.services.crm.hubspot import HubSpotClient

class CRMManager:
	def __init__(self) -> None:
		self.providers = []
		if settings.HUBSPOT_API_KEY:
			self.providers.append(HubSpotClient())
	async def update_stage(self, email: str, stage: str) -> None:
		for p in self.providers:
			await p.update_stage(email, stage)  # type: ignore[attr-defined]
	async def add_note(self, email: str, note: str) -> None:
		for p in self.providers:
			await p.add_note(email, note)  # type: ignore[attr-defined]
	async def upsert_contact(self, email: str, properties: Mapping[str, Any]) -> None:
		for p in self.providers:
			await p.upsert_contact(email, properties)  # type: ignore[attr-defined]

crm_manager = CRMManager()
