from datetime import datetime
from typing import Optional

import httpx

from app.core.config import settings

class GoogleCalendarService:
	async def create_event(self, title: str, start: datetime, end: Optional[datetime], description: Optional[str] = None) -> str:
		if not (settings.GOOGLE_CALENDAR_ACCESS_TOKEN and settings.GOOGLE_CALENDAR_ID):
			raise RuntimeError("Google Calendar is not configured. Set GOOGLE_CALENDAR_ACCESS_TOKEN and GOOGLE_CALENDAR_ID.")
		payload = {
			"summary": title,
			"description": description,
			"start": {"dateTime": start.isoformat()},
			"end": {"dateTime": (end or start).isoformat()},
		}
		async with httpx.AsyncClient(timeout=30) as client:
			resp = await client.post(
				f"https://www.googleapis.com/calendar/v3/calendars/{settings.GOOGLE_CALENDAR_ID}/events",
				headers={"Authorization": f"Bearer {settings.GOOGLE_CALENDAR_ACCESS_TOKEN}", "Content-Type": "application/json"},
				json=payload,
			)
			resp.raise_for_status()
			data = resp.json()
			return data.get("id", "")

calendar_service = GoogleCalendarService()
