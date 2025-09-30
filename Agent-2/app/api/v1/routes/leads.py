from typing import List, Optional
import os

from fastapi import APIRouter, Depends, Query, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.lead import Lead
from app.models.lead_note import LeadNote
from sqlalchemy import desc
from app.schemas.lead import LeadCreate, LeadOut, LeadUpdate
from app.services.scrapers.aggregator import aggregate_search
from app.core.config import settings
from app.models.scraping import SearchRun, LeadSource
from sqlalchemy import desc

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

@router.get("/search-runs")
async def list_search_runs(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200), db: AsyncSession = Depends(get_db)):
	from sqlalchemy import select
	res = await db.execute(select(SearchRun).order_by(desc(SearchRun.id)).offset(skip).limit(limit))
	runs = list(res.scalars().all())
	return [
		{
			"id": r.id,
			"query": r.query,
			"providers_requested": r.providers_requested,
			"providers_used": r.providers_used,
			"status": r.status,
			"errors": r.errors,
			"created_at": r.created_at.isoformat() if r.created_at else None,
		}
		for r in runs
	]

@router.get("/search-runs/{run_id}/sources")
async def list_search_run_sources(run_id: int, db: AsyncSession = Depends(get_db)):
	from sqlalchemy import select
	res = await db.execute(select(LeadSource).where(LeadSource.search_run_id == run_id).order_by(desc(LeadSource.id)))
	sources = list(res.scalars().all())
	return [
		{
			"id": s.id,
			"provider": s.provider,
			"lead_id": s.lead_id,
			"data": s.data,
			"created_at": s.created_at.isoformat() if s.created_at else None,
		}
		for s in sources
	]

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
	response: Response | None = None,
):
	from sqlalchemy import func
	base_stmt = select(Lead)
	if company_size:
		base_stmt = base_stmt.where(Lead.company_size == company_size)
	if role:
		base_stmt = base_stmt.where(Lead.role == role)
	if industry:
		base_stmt = base_stmt.where(Lead.industry == industry)
	if location:
		base_stmt = base_stmt.where(Lead.location == location)
	# total count header
	if response is not None:
		count_stmt = select(func.count()).select_from(base_stmt.subquery())
		count_res = await db.execute(count_stmt)
		total = count_res.scalar_one() or 0
		response.headers["X-Total-Count"] = str(total)
	stmt = base_stmt.offset(skip).limit(limit)
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

# --- Lead Notes ---

class LeadNoteCreate(BaseModel):
	content: str

class LeadNoteOut(BaseModel):
	id: int
	lead_id: int
	content: str
	created_at: str

@router.get("/{lead_id}/notes", response_model=List[LeadNoteOut])
async def list_lead_notes(lead_id: int, db: AsyncSession = Depends(get_db)):
	lead = await db.get(Lead, lead_id)
	if not lead:
		raise HTTPException(status_code=404, detail="Lead not found")
	from sqlalchemy import select
	res = await db.execute(select(LeadNote).where(LeadNote.lead_id == lead_id).order_by(desc(LeadNote.created_at)))
	notes = list(res.scalars().all())
	return [LeadNoteOut(id=n.id, lead_id=n.lead_id, content=n.content, created_at=n.created_at.isoformat()) for n in notes]

@router.post("/{lead_id}/notes", response_model=LeadNoteOut)
async def create_lead_note(lead_id: int, body: LeadNoteCreate, db: AsyncSession = Depends(get_db)):
	lead = await db.get(Lead, lead_id)
	if not lead:
		raise HTTPException(status_code=404, detail="Lead not found")
	note = LeadNote(lead_id=lead_id, content=body.content)
	db.add(note)
	await db.commit()
	await db.refresh(note)
	return LeadNoteOut(id=note.id, lead_id=note.lead_id, content=note.content, created_at=note.created_at.isoformat())

@router.delete("/{lead_id}/notes/{note_id}")
async def delete_lead_note(lead_id: int, note_id: int, db: AsyncSession = Depends(get_db)):
	lead = await db.get(Lead, lead_id)
	if not lead:
		raise HTTPException(status_code=404, detail="Lead not found")
	note = await db.get(LeadNote, note_id)
	if not note or note.lead_id != lead_id:
		raise HTTPException(status_code=404, detail="Note not found")
	await db.delete(note)
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
    records, run_id = await aggregate_search(query, providers)
    created: List[Lead] = []
    # Upsert by email/linkedin
    from sqlalchemy import select
    for r in records:
        payload = {k: v for k, v in r.items() if k in {"name","email","company","role","linkedin_url","source","company_size","industry","location"}}
        existing: Lead | None = None
        if payload.get("email"):
            res = await db.execute(select(Lead).where(Lead.email == payload["email"]))
            existing = res.scalars().first()
        if not existing and payload.get("linkedin_url"):
            res = await db.execute(select(Lead).where(Lead.linkedin_url == payload["linkedin_url"]))
            existing = res.scalars().first()
        if existing:
            for k, v in payload.items():
                if v is not None:
                    setattr(existing, k, v)
            db.add(existing)
            created.append(existing)
        else:
            lead = Lead(**payload)
            db.add(lead)
            created.append(lead)
    await db.commit()
    for l in created:
        await db.refresh(l)
    # Optionally attach lead_ids to LeadSource for this run
    if run_id:
        from sqlalchemy import update
        for l in created:
            await db.execute(update(LeadSource).where(LeadSource.search_run_id == run_id).where((LeadSource.data["email"].as_string() == (l.email or "")) | (LeadSource.data["linkedin_url"].as_string() == (l.linkedin_url or ""))).values(lead_id=l.id))
        await db.commit()
    return created