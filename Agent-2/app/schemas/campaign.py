from pydantic import BaseModel
from typing import Optional, List

class CampaignEmailBase(BaseModel):
	sequence_order: int = 1
	subject_template: Optional[str] = None
	body_template: Optional[str] = None
	send_delay_hours: int = 24
	is_follow_up: bool = False

class CampaignEmailCreate(CampaignEmailBase):
	pass

class CampaignEmailOut(CampaignEmailBase):
	id: int

	class Config:
		from_attributes = True

class CampaignBase(BaseModel):
	name: str
	offer: Optional[str] = None
	status: str = "draft"
	emails: Optional[List[CampaignEmailCreate]] = None

class CampaignCreate(CampaignBase):
	pass

class CampaignUpdate(BaseModel):
	name: Optional[str] = None
	offer: Optional[str] = None
	status: Optional[str] = None
	emails: Optional[List[CampaignEmailCreate]] = None

class CampaignOut(CampaignBase):
	id: int

	class Config:
		from_attributes = True
