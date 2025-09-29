from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router

app = FastAPI(title="Agent-3 — AI Calling Agent")

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

app.include_router(api_router, prefix="/api/v1")
