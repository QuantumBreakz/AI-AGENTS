from typing import Protocol

import httpx

from app.core.config import settings

class Dialer(Protocol):
	async def start_call(self, call_id: int, phone: str) -> None:
		...
	async def transfer_call(self, call_id: int, to_phone: str) -> None:
		...

class TwilioDialer:
	async def start_call(self, call_id: int, phone: str) -> None:
		if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER and settings.PUBLIC_BASE_URL):
			raise RuntimeError("Twilio not configured. Set TWILIO_* and PUBLIC_BASE_URL.")
		account = settings.TWILIO_ACCOUNT_SID
		base_url = f"https://api.twilio.com/2010-04-01/Accounts/{account}"
		answer_url = f"{settings.PUBLIC_BASE_URL}/api/v1/twilio/voice/answer?call_id={call_id}"
		status_cb = f"{settings.PUBLIC_BASE_URL}/api/v1/twilio/voice/status"
		async with httpx.AsyncClient(timeout=30, auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)) as client:
			payload = {
				"From": settings.TWILIO_FROM_NUMBER,
				"To": phone,
				"Url": answer_url,
				"StatusCallback": status_cb,
				"StatusCallbackEvent": ["initiated","ringing","answered","completed"],
			}
			resp = await client.post(f"{base_url}/Calls.json", data=payload)
			resp.raise_for_status()

	async def transfer_call(self, call_id: int, to_phone: str) -> None:
		if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN):
			raise RuntimeError("Twilio not configured.")
		# This requires knowing the CallSid; the transfer endpoint will be invoked from routes with CallSid
		return None

# default dialer instance

dialer: Dialer = TwilioDialer()
