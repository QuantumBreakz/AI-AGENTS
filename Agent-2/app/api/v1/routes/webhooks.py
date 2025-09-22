from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.models.lead import Lead
from app.models.lead_note import LeadNote
from app.models.campaign import CampaignRecipient
from app.services.crm.manager import crm_manager

router = APIRouter()

class InboundEmailPayload(BaseModel):
	email: str | None = None
	lead_id: int | None = None
	stage: str | None = None
	note: str | None = None
	autopause: bool = True

@router.post("/email")
async def inbound_email_webhook(payload: InboundEmailPayload, x_webhook_secret: str | None = Header(default=None), db: AsyncSession = Depends(get_db)):
	if settings.EMAIL_WEBHOOK_SECRET and x_webhook_secret != settings.EMAIL_WEBHOOK_SECRET:
		raise HTTPException(status_code=401, detail="Invalid signature")
	lead: Lead | None = None
	if payload.lead_id:
		lead = await db.get(Lead, payload.lead_id)
	elif payload.email:
		from sqlalchemy import select
		res = await db.execute(select(Lead).where(Lead.email == payload.email))
		lead = res.scalars().first()
	if not lead and payload.email:
		lead = Lead(email=payload.email)
		db.add(lead)
		await db.commit()
		await db.refresh(lead)
	if payload.note:
		note = LeadNote(lead_id=lead.id, content=payload.note)
		db.add(note)
	if payload.stage:
		lead.stage = payload.stage
	# auto-pause recipients
	if payload.autopause and lead:
		from sqlalchemy import select
		res = await db.execute(select(CampaignRecipient).where(CampaignRecipient.lead_id == lead.id).where(CampaignRecipient.paused == False))
		for rec in res.scalars().all():
			rec.paused = True
	await db.commit()
	if lead and lead.email:
		if payload.stage:
			await crm_manager.update_stage(lead.email, payload.stage)
		if payload.note:
			await crm_manager.add_note(lead.email, payload.note)
	return {"ok": True}
