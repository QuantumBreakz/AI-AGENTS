from typing import Literal, Mapping, Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai.suggest import suggest

router = APIRouter()

class SuggestRequest(BaseModel):
	kind: Literal["reply","rebuttal","pricing","pitch"]
	context: dict

@router.post("/suggest")
async def ai_suggest(body: SuggestRequest):
	text = await suggest(body.kind, body.context)
	return {"text": text}
