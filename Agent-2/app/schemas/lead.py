from pydantic import BaseModel, EmailStr
from typing import Optional

class LeadBase(BaseModel):
	name: Optional[str] = None
	email: Optional[EmailStr] = None
	company: Optional[str] = None
	role: Optional[str] = None
	linkedin_url: Optional[str] = None
	source: Optional[str] = None
	company_size: Optional[str] = None
	industry: Optional[str] = None
	location: Optional[str] = None
	stage: Optional[str] = None

class LeadCreate(LeadBase):
	pass

class LeadUpdate(LeadBase):
	pass

class LeadOut(LeadBase):
	id: int

	class Config:
		from_attributes = True

class LeadNoteCreate(BaseModel):
	lead_id: int
	content: str

class LeadNoteOut(BaseModel):
	id: int
	lead_id: int
	content: str

	class Config:
		from_attributes = True
