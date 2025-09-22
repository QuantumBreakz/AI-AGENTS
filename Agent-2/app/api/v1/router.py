from fastapi import APIRouter

from app.api.v1.routes.leads import router as leads_router
from app.api.v1.routes.campaigns import router as campaigns_router
from app.api.v1.routes.webhooks import router as webhooks_router
from app.api.v1.routes.ai import router as ai_router
from app.api.v1.routes.orchestrate import router as orchestrate_router
from app.api.v1.routes.jobs import router as jobs_router

api_router = APIRouter()
api_router.include_router(leads_router, prefix="/leads", tags=["leads"])
api_router.include_router(campaigns_router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(ai_router, prefix="/ai", tags=["ai"])
api_router.include_router(orchestrate_router, prefix="/orchestrate", tags=["orchestrate"])
api_router.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
