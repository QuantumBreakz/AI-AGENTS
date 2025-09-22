from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.call import CallSession, CallNote
from app.models.appointment import Appointment
from app.services.calendar.google import calendar_service
from app.services.inbound import faq as faq_service
from app.services.inbound import reservations as reservations_service
from app.services.crm.manager import crm_manager
from app.services.calling.dialer import dialer
from app.core.config import settings

router = APIRouter()

class InboundEvent(BaseModel):
	phone: str
	email: Optional[str] = None
	intent: str
	message: Optional[str] = None
	start_time: Optional[datetime] = None
	duration_minutes: Optional[int] = None
	transfer: bool = False

@router.post("/webhook")
async def inbound_event(body: InboundEvent, db: AsyncSession = Depends(get_db)):
	cs = CallSession(email=body.email, phone=body.phone, status="inbound")
	db.add(cs)
	await db.flush()
	response_text: Optional[str] = None
	if body.intent == "faq" and body.message:
		response_text = await faq_service.answer(body.message)
	elif body.intent == "book_meeting" and body.start_time:
		start = body.start_time
		end = start + timedelta(minutes=body.duration_minutes or 30)
		appt = Appointment(call_id=cs.id, email=body.email, start_time=start, end_time=end, title="Meeting", description=body.message)
		event_id = await calendar_service.create_event(appt.title or "Meeting", start, end, appt.description)
		appt.calendar_event_id = event_id
		db.add(appt)
		response_text = "Your meeting is booked. A calendar invite has been sent."
	elif body.intent == "reservation" and body.message:
		resv_id = await reservations_service.create_reservation({"phone": body.phone, "email": body.email, "note": body.message})
		response_text = f"Your reservation is confirmed: {resv_id}."
	if body.transfer and settings.HUMAN_AGENT_NUMBER:
		await dialer.transfer_call(cs.id, settings.HUMAN_AGENT_NUMBER)
		response_text = (response_text or "Transferring you now.")
	if response_text:
		db.add(CallNote(call_id=cs.id, content=response_text))
	await db.commit()
	if body.email and response_text:
		await crm_manager.add_note(body.email, response_text)
	return {"ok": True, "call_id": cs.id, "response": response_text}
