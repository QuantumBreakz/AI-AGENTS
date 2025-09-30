from fastapi import APIRouter, Header, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.models.lead import Lead
from app.models.lead_note import LeadNote
from app.models.campaign import CampaignRecipient
from app.models.email_tracking import EmailMessageLog, CampaignRecipientEvent
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

# --- Provider tracking webhooks ---

class ProviderEvent(BaseModel):
	# Common fields we expect from providers via mapping layer
	provider: str | None = None
	message_id: str | None = None
	recipient: str | None = None
	recipient_id: int | None = None
	lead_id: int | None = None
	event: str
	timestamp: str | None = None
	payload: dict | None = None

def _update_log_for_event(log: EmailMessageLog, event: str) -> None:
	from datetime import datetime
	if event == "delivered":
		log.status = "delivered"
		log.delivered_at = datetime.utcnow()
	elif event == "open":
		log.status = "opened"
		log.opened_at = datetime.utcnow()
	elif event == "click":
		log.status = "clicked"
		log.clicked_at = datetime.utcnow()
	elif event == "bounce":
		log.status = "bounced"
		log.bounced_at = datetime.utcnow()
	elif event == "complaint":
		log.status = "complained"
		log.complained_at = datetime.utcnow()
	elif event == "reply":
		log.status = "replied"
		log.replied_at = datetime.utcnow()

@router.post("/email/provider-event")
async def provider_event_webhook(body: ProviderEvent, x_webhook_secret: str | None = Header(default=None), db: AsyncSession = Depends(get_db)):
	if settings.EMAIL_WEBHOOK_SECRET and x_webhook_secret != settings.EMAIL_WEBHOOK_SECRET:
		raise HTTPException(status_code=401, detail="Invalid signature")
	# Try to locate log by provider message id first
	log: EmailMessageLog | None = None
	if body.message_id:
		from sqlalchemy import select
		res = await db.execute(select(EmailMessageLog).where(EmailMessageLog.provider_message_id == body.message_id))
		log = res.scalars().first()
	# Fallback by recipient + latest
	if not log and body.recipient:
		from sqlalchemy import select, desc
		res = await db.execute(
			select(EmailMessageLog)
			.where(EmailMessageLog.metadata["to"].as_string() == body.recipient)  # best-effort
			.order_by(desc(EmailMessageLog.created_at))
			.limit(1)
		)
		log = res.scalars().first()
	# Create a new log if still missing
	if not log:
		log = EmailMessageLog(
			provider=body.provider or "unknown",
			provider_message_id=body.message_id,
			lead_id=body.lead_id,
			metadata=body.payload or {},
		)
		db.add(log)
	# Update log based on event
	_update_log_for_event(log, body.event)
	# Map to recipient events if known
	if log.recipient_id:
		db.add(CampaignRecipientEvent(recipient_id=log.recipient_id, event_type=body.event, payload=body.payload))
	await db.commit()
	return {"ok": True}


# --- Provider-specific webhook mappers ---

@router.post("/email/sendgrid")
async def sendgrid_webhook(request: Request, db: AsyncSession = Depends(get_db)):
	# SendGrid posts an array of events
	try:
		payload = await request.json()
	except Exception:
		raise HTTPException(status_code=400, detail="Invalid JSON")
	if not isinstance(payload, list):
		raise HTTPException(status_code=400, detail="Expected list of events")
	for ev in payload:
		pe = ProviderEvent(
			provider="sendgrid",
			message_id=(ev.get("sg_message_id") or ev.get("smtp-id")),
			recipient=ev.get("email"),
			event=("open" if ev.get("event") == "open" else "click" if ev.get("event") == "click" else "bounce" if ev.get("event") == "bounce" else "delivered" if ev.get("event") == "delivered" else "complaint" if ev.get("event") == "spamreport" else ev.get("event") or "unknown"),
			timestamp=str(ev.get("timestamp")),
			payload=ev,
		)
		await provider_event_webhook(pe, None, db)  # no secret for provider mappers
	return {"ok": True}


@router.post("/email/ses")
async def ses_webhook(request: Request, db: AsyncSession = Depends(get_db)):
	# Expect SES JSON notification (simplified; real SES uses SNS)
	try:
		body = await request.json()
	except Exception:
		raise HTTPException(status_code=400, detail="Invalid JSON")
\t# Map common SES notification types
	mail = body.get("mail", {})
	common = {
		"provider": "ses",
		"message_id": mail.get("messageId"),
		"recipient": (mail.get("destination") or [None])[0],
		"payload": body,
	}
	if "delivery" in body:
		pe = ProviderEvent(event="delivered", **common)
		await provider_event_webhook(pe, None, db)
	elif "bounce" in body:
		pe = ProviderEvent(event="bounce", **common)
		await provider_event_webhook(pe, None, db)
	elif "complaint" in body:
		pe = ProviderEvent(event="complaint", **common)
		await provider_event_webhook(pe, None, db)
	else:
		pe = ProviderEvent(event="unknown", **common)
		await provider_event_webhook(pe, None, db)
	return {"ok": True}
