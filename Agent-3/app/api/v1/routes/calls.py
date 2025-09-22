from typing import List, Optional, Mapping, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.db import get_db
from app.models.call import CallSession, CallNote
from app.services.calling.dialer import dialer
from app.services.calling.voice_agent import voice_agent
from app.services.crm.manager import crm_manager

router = APIRouter()

class StartCallTarget(BaseModel):
	email: Optional[str] = None
	phone: str
	lead_id: Optional[int] = None
	context: Optional[Mapping[str, Any]] = None

class StartCallsRequest(BaseModel):
	targets: List[StartCallTarget]
	campaign_offer: Optional[str] = None
	purpose: Optional[str] = None  # "sales" | "job_application"

@router.get("")
async def list_calls(db: AsyncSession = Depends(get_db)):
	res = await db.execute(select(CallSession).order_by(desc(CallSession.created_at)).limit(100))
	calls = list(res.scalars().all())
	call_ids = [c.id for c in calls]
	notes_map = {cid: [] for cid in call_ids}
	if call_ids:
		resn = await db.execute(select(CallNote).where(CallNote.call_id.in_(call_ids)).order_by(desc(CallNote.created_at)))
		for n in resn.scalars().all():
			notes_map.setdefault(n.call_id, []).append({"id": n.id, "content": n.content, "created_at": n.created_at.isoformat()})
	return [
		{
			"id": c.id,
			"email": c.email,
			"phone": c.phone,
			"status": c.status,
			"purpose": c.purpose,
			"context": c.context,
			"created_at": c.created_at.isoformat(),
			"notes": notes_map.get(c.id, []),
		}
		for c in calls
	]

@router.post("/start")
async def start_calls(body: StartCallsRequest, db: AsyncSession = Depends(get_db)):
	started: List[int] = []
	for t in body.targets:
		cs = CallSession(
			email=t.email,
			phone=t.phone,
			lead_id=t.lead_id,
			status="initiated",
			offer=body.campaign_offer,
			purpose=body.purpose,
			context=(t.context and str(t.context)) or None,
		)
		db.add(cs)
		await db.flush()
		await dialer.start_call(cs.id, t.phone)
		started.append(cs.id)
	await db.commit()
	return {"ok": True, "calls": started}

class StartSalesCallsRequest(BaseModel):
	targets: List[StartCallTarget]
	campaign_offer: Optional[str] = None

@router.post("/start-sales")
async def start_sales_calls(body: StartSalesCallsRequest, db: AsyncSession = Depends(get_db)):
	return await start_calls(StartCallsRequest(targets=body.targets, campaign_offer=body.campaign_offer, purpose="sales"), db)

class StartJobCallsRequest(BaseModel):
	targets: List[StartCallTarget]
	position_title: Optional[str] = None

@router.post("/start-jobs")
async def start_job_calls(body: StartJobCallsRequest, db: AsyncSession = Depends(get_db)):
	ctx_targets = [StartCallTarget(email=t.email, phone=t.phone, lead_id=t.lead_id, context={"position_title": body.position_title, **(t.context or {})}) for t in body.targets]
	return await start_calls(StartCallsRequest(targets=ctx_targets, campaign_offer=body.position_title, purpose="job_application"), db)

class CallWebhookPayload(BaseModel):
	call_id: int
	note: Optional[str] = None
	stage: Optional[str] = None
	disposition: Optional[str] = None

@router.post("/webhook")
async def call_webhook(payload: CallWebhookPayload, db: AsyncSession = Depends(get_db)):
	cs = await db.get(CallSession, payload.call_id)
	if not cs:
		return {"ok": False}
	if payload.note:
		db.add(CallNote(call_id=cs.id, content=payload.note))
	if payload.stage:
		cs.stage = payload.stage
	if payload.disposition:
		cs.disposition = payload.disposition
	await db.commit()
	if cs.email:
		if payload.stage:
			await crm_manager.update_stage(cs.email, payload.stage)
		if payload.note:
			await crm_manager.add_note(cs.email, payload.note)
	return {"ok": True}
