from fastapi import APIRouter

from app.api.v1.routes import calls, inbound, business, twilio

api_router = APIRouter()
api_router.include_router(calls.router, prefix="/calls", tags=["calls"])
api_router.include_router(inbound.router, prefix="/inbound", tags=["inbound"]) 
api_router.include_router(business.router, prefix="/business", tags=["business"]) 
api_router.include_router(twilio.router, prefix="/twilio", tags=["twilio"])
