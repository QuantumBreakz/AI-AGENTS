import os
from typing import Mapping, Any, List

from app.services.crm.hubspot import HubSpotClient
from app.services.crm.pipedrive import PipedriveClient
from app.services.crm.salesforce import SalesforceClient
from app.services.crm.zoho import ZohoClient

ENABLED = set(filter(None, (os.getenv("ENABLED_CRMS") or "").lower().split(",")))

class CRMManager:
	def __init__(self) -> None:
		self.providers = []
		if not ENABLED or "hubspot" in ENABLED:
			self.providers.append(HubSpotClient())
		if not ENABLED or "pipedrive" in ENABLED:
			self.providers.append(PipedriveClient())
		if not ENABLED or "salesforce" in ENABLED:
			self.providers.append(SalesforceClient())
		if not ENABLED or "zoho" in ENABLED:
			self.providers.append(ZohoClient())

	async def upsert_contact(self, email: str, properties: Mapping[str, Any]) -> None:
		for p in self.providers:
			await p.upsert_contact(email, properties)

	async def update_stage(self, email: str, stage: str) -> None:
		for p in self.providers:
			await p.update_stage(email, stage)

	async def add_note(self, email: str, note: str) -> None:
		for p in self.providers:
			await p.add_note(email, note)

crm_manager = CRMManager()
