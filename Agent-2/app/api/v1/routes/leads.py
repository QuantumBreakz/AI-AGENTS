from typing import List, Optional
import os

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadOut, LeadUpdate
from app.services.scrapers.aggregator import aggregate_search
from app.core.config import settings

router = APIRouter()

@router.get("/debug-scrapers")
async def debug_scrapers():
	"""Debug endpoint to check scraper configuration"""
	
	api_status = {
		"APOLLO_API_KEY": bool(settings.APOLLO_API_KEY),
		"CRUNCHBASE_API_KEY": bool(settings.CRUNCHBASE_API_KEY),
		"PROXYCURL_API_KEY": bool(settings.PROXYCURL_API_KEY),
		"SERPAPI_API_KEY": bool(settings.SERPAPI_API_KEY),
	}
	
	configured_scrapers = set(filter(None, (settings.ENABLED_SCRAPERS or "").lower().split(",")))
	
	auto_detected = []
	if settings.APOLLO_API_KEY:
		auto_detected.append("apollo")
	if settings.CRUNCHBASE_API_KEY:
		auto_detected.append("crunchbase")
	if settings.PROXYCURL_API_KEY:
		auto_detected.append("linkedin")
	if settings.SERPAPI_API_KEY:
		auto_detected.append("clutch")
	
	final_scrapers = list(configured_scrapers) if configured_scrapers else auto_detected
	
	# Check .env file locations
	env_files_to_check = [
		".env",
		"../.env",
		"../../.env",
		os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"),
		os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".env"),
	]
	
	env_file_status = {}
	for env_path in env_files_to_check:
		env_file_status[env_path] = os.path.exists(env_path)
	
	return {
		"api_keys_configured": api_status,
		"explicitly_enabled_scrapers": list(configured_scrapers),
		"auto_detected_scrapers": auto_detected,
		"final_scrapers": final_scrapers,
		"env_file_locations": env_file_status,
		"mock_data_fallback": "enabled" if not final_scrapers else "disabled",
		"current_working_directory": os.getcwd(),
		"config_file_location": os.path.dirname(__file__)
	}

@router.get("/test-mock-scraping")
async def test_mock_scraping():
	"""Test scraping with mock data"""
	query = {
		"role": "CTO",
		"industry": "Technology",
		"location": "San Francisco",
		"company_size": "startup"
	}
	
	# Force mock data by passing empty providers list
	records = await aggregate_search(query, providers=[])
	
	return {
		"query": query,
		"results": records,
		"count": len(records),
		"message": "Mock data generated successfully"
	}

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