from fastapi import APIRouter

router = APIRouter()

@router.get("/healthz")
async def healthz():
	return {"ok": True}

@router.get("/readyz")
async def readyz():
	# In a fuller setup, check DB connectivity, required configs, etc.
	return {"ready": True}


