from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.campaign import Campaign, CampaignEmail, CampaignRecipient
from app.models.lead import Lead
from app.services.scrapers.aggregator import aggregate_search
from app.services.ai.suggest import suggest

router = APIRouter()

class OneClickRequest(BaseModel):
	# scraping filters
	company_size: Optional[str] = None
	role: Optional[str] = None
	industry: Optional[str] = None
	location: Optional[str] = None
	providers: Optional[List[str]] = None
	limit: int = 25
	# campaign
	campaign_name: str = "One-Click Outreach"
	offer: str
	steps: int = 3
	send_now: bool = True

@router.post("/one-click")
async def one_click(body: OneClickRequest, db: AsyncSession = Depends(get_db)):
	# 1) Scrape
	query = {"company_size": body.company_size, "role": body.role, "industry": body.industry, "location": body.location}
	records = await aggregate_search(query, body.providers)
	records = records[: max(0, body.limit)]

	# 2) Upsert leads (by email or linkedin_url)
	created_lead_ids: List[int] = []
	for r in records:
		lead: Lead | None = None
		key_email = (r.get("email") or "").lower()
		key_li = (r.get("linkedin_url") or "").lower()
		if key_email:
			res = await db.execute(select(Lead).where(Lead.email == key_email))
			lead = res.scalars().first()
		if not lead and key_li:
			res = await db.execute(select(Lead).where(Lead.linkedin_url == key_li))
			lead = res.scalars().first()
		if not lead:
			lead = Lead(**{k: v for k, v in r.items() if k in {"name","email","company","role","linkedin_url","source","company_size","industry","location"}})
			db.add(lead)
			await db.flush()
		else:
			for k, v in r.items():
				if k in {"name","company","role","linkedin_url","source","company_size","industry","location"} and getattr(lead, k) is None and v:
					setattr(lead, k, v)
			await db.flush()
		created_lead_ids.append(lead.id)
	await db.commit()

	# 3) Create campaign
	campaign = Campaign(name=body.campaign_name, offer=body.offer, status="active")
	db.add(campaign)
	await db.commit()
	await db.refresh(campaign)

	# 4) Generate AI sequence
	texts = []
	for i in range(body.steps):
		text = await suggest("reply", {"role": body.role, "offer": body.offer, "step": i + 1})
		texts.append(text)
	from datetime import timedelta
	for i, t in enumerate(texts):
		campaign.emails.append(CampaignEmail(sequence_order=i + 1, subject_template=f"{body.offer} — Step {i+1}", body_template=t, send_delay_hours=24 if i else 0, is_follow_up=i>0))
	await db.commit()

	# 5) Enroll leads
	from datetime import datetime, timezone
	recipient_ids: List[int] = []
	for lead_id in created_lead_ids:
		lead = await db.get(Lead, lead_id)
		if not lead or not lead.email:
			continue
		rec = CampaignRecipient(campaign_id=campaign.id, lead_id=lead.id, email=lead.email)
		if body.send_now:
			rec.next_send_at = datetime.now(timezone.utc)
		db.add(rec)
		await db.flush()
		recipient_ids.append(rec.id)
	await db.commit()

	return {
		"ok": True,
		"campaign_id": campaign.id,
		"recipients": recipient_ids,
		"leads": created_lead_ids,
	}
