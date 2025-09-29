from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.applicant import ApplicantProfile, JobApplicationAttempt
from app.services.jobs.auto_apply import auto_apply_linkedin, auto_apply_handshake

router = APIRouter()

@router.get("/profile")
async def get_profile(db: AsyncSession = Depends(get_db)):
	profile = await db.get(ApplicantProfile, 1)
	if not profile:
		return {"name": "", "email": "", "job_title_pref": "", "location_pref": "", "resume_path": ""}
	return {
		"name": profile.name or "",
		"email": profile.email or "",
		"job_title_pref": profile.job_title_pref or "",
		"location_pref": profile.location_pref or "",
		"resume_path": profile.resume_path or ""
	}

@router.post("/profile/upload-resume")
async def upload_resume(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
	# store to disk; in production, store to S3/GCS
	path = f"/tmp/{file.filename}"
	with open(path, "wb") as f:
		f.write(await file.read())
	# single profile for now
	profile = (await db.get(ApplicantProfile, 1)) or ApplicantProfile(id=1)
	profile.resume_path = path
	db.add(profile)
	await db.commit()
	return {"ok": True, "resume_path": path}

class ProfileUpdate(BaseModel):
	name: Optional[str] = None
	email: Optional[str] = None
	job_title_pref: Optional[str] = None
	location_pref: Optional[str] = None
	salary_min: Optional[int] = None
	company_size_pref: Optional[str] = None

@router.post("/profile")
async def update_profile(body: ProfileUpdate, db: AsyncSession = Depends(get_db)):
	profile = (await db.get(ApplicantProfile, 1)) or ApplicantProfile(id=1)
	for k, v in body.model_dump(exclude_unset=True).items():
		setattr(profile, k, v)
	db.add(profile)
	await db.commit()
	return {"ok": True}

class ApplyFilters(BaseModel):
	job_title: Optional[str] = None
	location: Optional[str] = None
	salary_min: Optional[int] = None
	company_size: Optional[str] = None

@router.post("/auto-apply")
async def auto_apply(body: ApplyFilters, provider: str = "linkedin", db: AsyncSession = Depends(get_db)):
	profile = (await db.get(ApplicantProfile, 1)) or ApplicantProfile(id=1)
	filters = {"job_title": body.job_title or profile.job_title_pref, "location": body.location or profile.location_pref, "salary_min": body.salary_min or profile.salary_min, "company_size": body.company_size or profile.company_size_pref}
	if provider == "linkedin":
		count = await auto_apply_linkedin({"resume_path": profile.resume_path, "email": profile.email}, filters)
	elif provider == "handshake":
		count = await auto_apply_handshake({"resume_path": profile.resume_path, "email": profile.email}, filters)
	else:
		count = 0
	attempt = JobApplicationAttempt(provider=provider, job_ref=None, status="submitted", response=f"Applied to {count} jobs")
	db.add(attempt)
	await db.commit()
	return {"ok": True, "applied": count}
