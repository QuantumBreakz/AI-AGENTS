from typing import Mapping, Any

from app.services.crm.base import CRMService

class MockCRMService:
	async def upsert_contact(self, email: str, properties: Mapping[str, Any]) -> None:
		return None

	async def update_stage(self, email: str, stage: str) -> None:
		return None

	async def add_note(self, email: str, note: str) -> None:
		return None

crm_service: CRMService = MockCRMService()
