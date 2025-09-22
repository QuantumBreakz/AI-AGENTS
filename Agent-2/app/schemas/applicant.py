from pydantic import BaseModel, EmailStr
from typing import Optional

class ApplicantProfileBase(BaseModel):
	name: Optional[str] = None
	email: Optional[EmailStr] = None
	resume_path: Optional[str] = None
	job_title_pref: Optional[str] = None
	location_pref: Optional[str] = None
	salary_min: Optional[int] = None
	company_size_pref: Optional[str] = None

class ApplicantProfileCreate(ApplicantProfileBase):
	pass

class ApplicantProfileUpdate(ApplicantProfileBase):
	pass

class ApplicantProfileOut(ApplicantProfileBase):
	id: int
	class Config:
		from_attributes = True

class JobApplicationAttemptOut(BaseModel):
	id: int
	provider: str
	job_ref: Optional[str]
	status: str
	response: Optional[str]
	class Config:
		from_attributes = True
