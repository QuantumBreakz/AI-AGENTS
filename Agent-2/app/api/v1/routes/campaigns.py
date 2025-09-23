from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.campaign import Campaign, CampaignEmail, CampaignEmailVariant, CampaignRecipient
from app.schemas.campaign import (
	CampaignCreate,
	CampaignOut,
	CampaignUpdate,
	CampaignEmailCreate,
)
from app.models.lead import Lead
from app.services.ai.suggest import suggest

router = APIRouter()

@router.get("/", response_model=List[CampaignOut])
async def list_campaigns(db: AsyncSession = Depends(get_db)):
	res = await db.execute(select(Campaign))
	return list(res.scalars().all())

@router.post("/", response_model=CampaignOut)
async def create_campaign(payload: CampaignCreate, db: AsyncSession = Depends(get_db)):
	campaign = Campaign(name=payload.name, offer=payload.offer, status=payload.status)
	if payload.emails:
		await db.flush()
		for i, e in enumerate(payload.emails):
			db.add(
				CampaignEmail(
					campaign_id=campaign.id,
					sequence_order=e.sequence_order or i + 1,
					subject_template=e.subject_template,
					body_template=e.body_template,
					send_delay_hours=e.send_delay_hours,
					is_follow_up=e.is_follow_up,
				)
			)
	db.add(campaign)
	await db.commit()
	await db.refresh(campaign)
	return campaign

@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
	return await db.get(Campaign, campaign_id)

@router.patch("/{campaign_id}", response_model=CampaignOut)
async def update_campaign(campaign_id: int, payload: CampaignUpdate, db: AsyncSession = Depends(get_db)):
	campaign = await db.get(Campaign, campaign_id)
	if not campaign:
		return None
	for k, v in payload.model_dump(exclude_unset=True, exclude={"emails"}).items():
		setattr(campaign, k, v)
	if payload.emails is not None:
		from sqlalchemy import delete
		await db.execute(delete(CampaignEmail).where(CampaignEmail.campaign_id == campaign.id))
		await db.flush()
		for i, e in enumerate(payload.emails):
			db.add(
				CampaignEmail(
					campaign_id=campaign.id,
					sequence_order=e.sequence_order or i + 1,
					subject_template=e.subject_template,
					body_template=e.body_template,
					send_delay_hours=e.send_delay_hours,
					is_follow_up=e.is_follow_up,
				)
			)
	await db.commit()
	await db.refresh(campaign)
	return campaign

class EnrollRequest(BaseModel):
	lead_ids: List[int]
	send_now: bool = False

@router.post("/{campaign_id}/enroll")
async def enroll_recipients(campaign_id: int, body: EnrollRequest, db: AsyncSession = Depends(get_db)):
	campaign = await db.get(Campaign, campaign_id)
	if not campaign:
		return {"ok": False}
	from datetime import datetime, timezone
	for lead_id in body.lead_ids:
		lead = await db.get(Lead, lead_id)
		if not lead or not lead.email:
			continue
		rec = CampaignRecipient(campaign_id=campaign_id, lead_id=lead_id, email=lead.email)
		if body.send_now:
			rec.next_send_at = datetime.now(timezone.utc)
		db.add(rec)
	await db.commit()
	return {"ok": True}

class PauseRequest(BaseModel):
	paused: bool

@router.post("/{campaign_id}/recipients/{recipient_id}/pause")
async def pause_recipient(campaign_id: int, recipient_id: int, body: PauseRequest, db: AsyncSession = Depends(get_db)):
	rec = await db.get(CampaignRecipient, recipient_id)
	if not rec or rec.campaign_id != campaign_id:
		return {"ok": False}
	rec.paused = body.paused
	await db.commit()
	return {"ok": True}

class VariantRequest(BaseModel):
	label: str
	subject_template: str | None = None
	body_template: str | None = None
	weight: int = 1

@router.post("/emails/{email_id}/variants")
async def add_variant(email_id: int, body: VariantRequest, db: AsyncSession = Depends(get_db)):
	email = await db.get(CampaignEmail, email_id)
	if not email:
		return {"ok": False}
	var = CampaignEmailVariant(email_id=email_id, label=body.label, subject_template=body.subject_template, body_template=body.body_template, weight=body.weight)
	db.add(var)
	await db.commit()
	return {"ok": True}

class GenerateSequenceRequest(BaseModel):
	role: str
	offer: str
	steps: int = 3

@router.post("/{campaign_id}/generate-sequence")
async def generate_sequence(campaign_id: int, body: GenerateSequenceRequest, db: AsyncSession = Depends(get_db)):
	texts = []
	for i in range(body.steps):
		text = await suggest("reply", {"role": body.role, "offer": body.offer, "step": i + 1})
		texts.append(text)
	campaign = await db.get(Campaign, campaign_id)
	if not campaign:
		return {"ok": False}
	from datetime import timedelta
	await db.flush()
	for i, t in enumerate(texts):
		db.add(CampaignEmail(campaign_id=campaign.id, sequence_order=i + 1, subject_template=f"{body.offer} — Step {i+1}", body_template=t, send_delay_hours=24 if i else 0, is_follow_up=i>0))
	await db.commit()
	return {"ok": True, "steps": len(texts)}
