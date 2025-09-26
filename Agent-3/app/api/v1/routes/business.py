from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.business import BusinessProfile

router = APIRouter()

class BusinessProfileUpdate(BaseModel):
	industry: Optional[str] = None
	company_name: Optional[str] = None
	company_phone: Optional[str] = None
	services_offered: Optional[str] = None
	greeting_script: Optional[str] = None

@router.get("/profile")
async def get_profile(db: AsyncSession = Depends(get_db)):
	bp = (await db.get(BusinessProfile, 1)) or BusinessProfile(id=1)
	if not bp.id:
		db.add(bp)
		await db.commit()
		await db.refresh(bp)
	
	return {
		"id": bp.id,
		"industry": bp.industry,
		"company_name": bp.company_name,
		"company_phone": bp.company_phone,
		"services_offered": bp.services_offered,
		"greeting_script": bp.greeting_script,
		"created_at": bp.created_at.isoformat() if bp.created_at else None,
		"updated_at": bp.updated_at.isoformat() if bp.updated_at else None
	}

@router.post("/profile")
async def update_profile(body: BusinessProfileUpdate, db: AsyncSession = Depends(get_db)):
	bp = (await db.get(BusinessProfile, 1)) or BusinessProfile(id=1)
	for k, v in body.model_dump(exclude_unset=True).items():
		setattr(bp, k, v)
	db.add(bp)
	await db.commit()
	await db.refresh(bp)
	
	return {
		"id": bp.id,
		"industry": bp.industry,
		"company_name": bp.company_name,
		"company_phone": bp.company_phone,
		"services_offered": bp.services_offered,
		"greeting_script": bp.greeting_script,
		"created_at": bp.created_at.isoformat() if bp.created_at else None,
		"updated_at": bp.updated_at.isoformat() if bp.updated_at else None
	}
