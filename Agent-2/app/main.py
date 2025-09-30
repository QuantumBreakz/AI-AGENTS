from fastapi import FastAPI, Request
from fastapi.responses import ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid
import logging
import asyncio

from app.core.config import settings
from app.core.db import init_db
from app.api.v1.router import api_router
from app.services.campaigns.scheduler import send_due_emails_once

app = FastAPI(
	title=settings.PROJECT_NAME,
	default_response_class=ORJSONResponse,
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://0.0.0.0:3000",
		"http://localhost:3030",
		"http://127.0.0.1:3030",
		"http://0.0.0.0:3030",
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

request_logger = logging.getLogger("request")

@app.middleware("http")
async def add_request_id_and_log(request: Request, call_next):
	request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
	request.state.request_id = request_id
	response = await call_next(request)
	response.headers["X-Request-ID"] = request_id
	request_logger.info(f"{request.method} {request.url.path}", extra={"request_id": request_id})
	return response

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
