from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
import asyncio

from app.core.config import settings
from app.core.db import init_db
from app.api.v1.router import api_router
from app.services.campaigns.scheduler import send_due_emails_once

app = FastAPI(
	title=settings.PROJECT_NAME,
	default_response_class=ORJSONResponse,
)

@app.on_event("startup")
async def on_startup() -> None:
	await init_db()
	async def _loop():
		while True:
			try:
				await send_due_emails_once()
			except Exception:
				pass
			await asyncio.sleep(60)
	import asyncio as _a
	_a.create_task(_loop())

app.include_router(api_router, prefix=settings.API_PREFIX)
