from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadOut, LeadUpdate
from app.services.scrapers.aggregator import aggregate_search

router = APIRouter()

@router.get("/", response_model=List[LeadOut])
async def list_leads(
	company_size: Optional[str] = None,
	role: Optional[str] = None,
	industry: Optional[str] = None,
	location: Optional[str] = None,
	skip: int = Query(0, ge=0),
	limit: int = Query(50, ge=1, le=200),
	db: AsyncSession = Depends(get_db),
):
	stmt = select(Lead)
	if company_size:
		stmt = stmt.where(Lead.company_size == company_size)
	if role:
		stmt = stmt.where(Lead.role == role)
	if industry:
		stmt = stmt.where(Lead.industry == industry)
	if location:
		stmt = stmt.where(Lead.location == location)
	stmt = stmt.offset(skip).limit(limit)
	res = await db.execute(stmt)
	return list(res.scalars().all())

@router.post("/", response_model=LeadOut)
async def create_lead(payload: LeadCreate, db: AsyncSession = Depends(get_db)):
	lead = Lead(**payload.model_dump(exclude_unset=True))
	db.add(lead)
	await db.commit()
	await db.refresh(lead)
	return lead

@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(lead_id: int, db: AsyncSession = Depends(get_db)):
	res = await db.get(Lead, lead_id)
	return res

@router.patch("/{lead_id}", response_model=LeadOut)
async def update_lead(lead_id: int, payload: LeadUpdate, db: AsyncSession = Depends(get_db)):
	lead = await db.get(Lead, lead_id)
	if not lead:
		return None
	for k, v in payload.model_dump(exclude_unset=True).items():
		setattr(lead, k, v)
	await db.commit()
	await db.refresh(lead)
	return lead

@router.delete("/{lead_id}")
async def delete_lead(lead_id: int, db: AsyncSession = Depends(get_db)):
	lead = await db.get(Lead, lead_id)
	if not lead:
		return {"ok": True}
	await db.delete(lead)
	await db.commit()
	return {"ok": True}

@router.post("/scrape", response_model=List[LeadOut])
async def scrape_leads(
	company_size: Optional[str] = None,
	role: Optional[str] = None,
	industry: Optional[str] = None,
	location: Optional[str] = None,
	providers: Optional[List[str]] = Query(default=None),
	db: AsyncSession = Depends(get_db),
):
	query = {"company_size": company_size, "role": role, "industry": industry, "location": location}
	records = await aggregate_search(query, providers)
	created: List[Lead] = []
	for r in records:
		lead = Lead(**{k: v for k, v in r.items() if k in {"name","email","company","role","linkedin_url","source","company_size","industry","location"}})
		db.add(lead)
		created.append(lead)
	await db.commit()
	for l in created:
		await db.refresh(l)
	return created
