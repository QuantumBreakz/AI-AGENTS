import hmac
import hashlib
import base64

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.call import CallSession, CallNote, CallEvent
from app.models.business import BusinessProfile
from app.services.calling.voice_agent import voice_agent
from app.services.crm.manager import crm_manager
from app.core.config import settings

router = APIRouter()

async def _get_business(db: AsyncSession) -> dict:
	bp = (await db.get(BusinessProfile, 1)) or BusinessProfile(id=1)
	if not bp.id:
		db.add(bp)
		await db.commit()
		await db.refresh(bp)
	return bp.__dict__

def _validate_twilio_signature(request: Request, body: dict) -> None:
	if not settings.TWILIO_VALIDATE_SIGNATURE:
		return
	signature = request.headers.get("X-Twilio-Signature")
	if not signature:
		raise HTTPException(status_code=401, detail="Missing Twilio signature")
	# Construct expected signature: base64(hmac_sha1(auth_token, url + sorted_params))
	url = str(request.url)
	params = dict(body)
	query = "".join([f"{k}{params[k]}" for k in sorted(params.keys())])
	data = (url.split("?")[0] + query).encode()
	digest = hmac.new((settings.TWILIO_AUTH_TOKEN or "").encode(), data, hashlib.sha1).digest()
	expected = base64.b64encode(digest).decode()
	if expected != signature:
		raise HTTPException(status_code=401, detail="Invalid Twilio signature")

def _map_status_to_disposition(status: str | None) -> str | None:
    if not status:
        return None
    status = status.lower()
    if status in ("completed", "answered"):
        return "completed"
    if status in ("busy", "no-answer"):
        return "no_answer"
    if status in ("failed",):
        return "failed"
    return status

@router.post("/voice/status")
async def voice_status(request: Request, db: AsyncSession = Depends(get_db)):
	form = await request.form()
	_validate_twilio_signature(request, form)
	call_sid = form.get("CallSid")
	call_id = form.get("call_id") or form.get("CallId")
    call_status = form.get("CallStatus")
	if call_id:
		try:
			cid = int(call_id)
			cs = await db.get(CallSession, cid)
			if cs and call_sid and not cs.twilio_call_sid:
				cs.twilio_call_sid = call_sid
            if cs and call_status:
                cs.status = call_status
                disp = _map_status_to_disposition(call_status)
                if disp:
                    cs.disposition = disp
                db.add(CallEvent(call_id=cs.id, event_type=call_status, payload=str(dict(form))))
            if cs:
                db.add(cs)
                await db.commit()
		except Exception:
			pass
	return {"ok": True}

@router.post("/voice/answer")
async def voice_answer(request: Request, db: AsyncSession = Depends(get_db)):
	form = await request.form()
	_validate_twilio_signature(request, form)
	call_sid = form.get("CallSid")
	from_number = form.get("From")
	call_id = request.query_params.get("call_id")
	if call_id:
		cs = await db.get(CallSession, int(call_id))
		if cs:
			cs.twilio_call_sid = call_sid or cs.twilio_call_sid
			db.add(cs)
			await db.commit()
			await db.refresh(cs)
	else:
		cs = CallSession(phone=from_number or "unknown", status="inbound", twilio_call_sid=call_sid)
		db.add(cs)
		await db.commit()
		await db.refresh(cs)
	biz = await _get_business(db)
	greeting = await voice_agent.greeting(biz)
	twiml = (
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
		"<Response>"
		f"<Say>{greeting}</Say>"
		"<Gather input=\"speech\" action=\"/api/v1/twilio/voice/gather\" speechTimeout=\"auto\"/>"
		"</Response>"
	)
	return Response(content=twiml, media_type="application/xml")

@router.post("/voice/gather")
async def voice_gather(request: Request, db: AsyncSession = Depends(get_db)):
	form = await request.form()
	_validate_twilio_signature(request, form)
	speech_result = form.get("SpeechResult") or ""
	call_sid = form.get("CallSid")
	# Link to session
	cs = None
	if call_sid:
		from sqlalchemy import select
		res = await db.execute(select(CallSession).where(CallSession.twilio_call_sid == call_sid))
		cs = res.scalars().first()
	biz = await _get_business(db)
	pitch = await voice_agent.generate_pitch({"business": biz, "user_input": speech_result})
    if cs and speech_result:
		db.add(CallNote(call_id=cs.id, content=f"User said: {speech_result}"))
		await db.commit()
		if cs.email:
			await crm_manager.add_note(cs.email, f"Call transcript note: {speech_result}")
	twiml = (
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
		"<Response>"
		f"<Say>{pitch}</Say>"
		"<Gather input=\"speech\" action=\"/api/v1/twilio/voice/gather\" speechTimeout=\"auto\"/>"
		"</Response>"
	)
	return Response(content=twiml, media_type="application/xml")

@router.post("/voice/recording")
async def voice_recording(request: Request, db: AsyncSession = Depends(get_db)):
    form = await request.form()
    _validate_twilio_signature(request, form)
    call_sid = form.get("CallSid")
    recording_url = form.get("RecordingUrl")
    from sqlalchemy import select
    if call_sid:
        res = await db.execute(select(CallSession).where(CallSession.twilio_call_sid == call_sid))
        cs = res.scalars().first()
        if cs and recording_url:
            cs.recording_url = recording_url
            db.add(CallEvent(call_id=cs.id, event_type="recording", payload=str(dict(form))))
            db.add(cs)
            await db.commit()
    return {"ok": True}

@router.post("/voice/completed")
async def voice_completed(request: Request, db: AsyncSession = Depends(get_db)):
    form = await request.form()
    _validate_twilio_signature(request, form)
    call_sid = form.get("CallSid")
    call_status = form.get("CallStatus")
    recording_url = form.get("RecordingUrl")
    from sqlalchemy import select
    cs = None
    if call_sid:
        res = await db.execute(select(CallSession).where(CallSession.twilio_call_sid == call_sid))
        cs = res.scalars().first()
    if cs:
        cs.status = call_status or cs.status
        disp = _map_status_to_disposition(call_status)
        if disp:
            cs.disposition = disp
        if recording_url and not cs.recording_url:
            cs.recording_url = recording_url
        db.add(CallEvent(call_id=cs.id, event_type="completed", payload=str(dict(form))))
        db.add(cs)
        await db.commit()
    return {"ok": True}

@router.post("/voice/transcription")
async def voice_transcription(request: Request, db: AsyncSession = Depends(get_db)):
    form = await request.form()
    _validate_twilio_signature(request, form)
    call_sid = form.get("CallSid")
    transcript_text = form.get("TranscriptionText") or form.get("transcript")
    from sqlalchemy import select
    if call_sid and transcript_text:
        res = await db.execute(select(CallSession).where(CallSession.twilio_call_sid == call_sid))
        cs = res.scalars().first()
        if cs:
            cs.transcript = transcript_text
            db.add(CallEvent(call_id=cs.id, event_type="transcription", payload=str(dict(form))))
            db.add(cs)
            await db.commit()
            if cs.email:
                await crm_manager.add_note(cs.email, f"Call transcription: {transcript_text[:800]}")
    return {"ok": True}

@router.post("/voice/transfer")
async def voice_transfer(request: Request, db: AsyncSession = Depends(get_db)):
	form = await request.form()
	_validate_twilio_signature(request, form)
	call_sid = form.get("CallSid")
	if not (call_sid and settings.HUMAN_AGENT_NUMBER):
		raise HTTPException(status_code=400, detail="Missing CallSid or HUMAN_AGENT_NUMBER")
	# Redirect call to a simple TwiML that dials human agent
	twiml = (
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
		"<Response>"
		f"<Dial>{settings.HUMAN_AGENT_NUMBER}</Dial>"
		"</Response>"
	)
	return Response(content=twiml, media_type="application/xml")
