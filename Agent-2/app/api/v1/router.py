from fastapi import APIRouter

from app.api.v1.routes.leads import router as leads_router
from app.api.v1.routes.campaigns import router as campaigns_router
from app.api.v1.routes.webhooks import router as webhooks_router
from app.api.v1.routes.ai import router as ai_router
from app.api.v1.routes.orchestrate import router as orchestrate_router
from app.api.v1.routes.jobs import router as jobs_router
from app.api.v1.routes.analytics import router as analytics_router
from app.api.v1.routes.scoring import router as scoring_router
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.auth import get_current_user
from fastapi import Depends
from app.services.security.rate_limit import rate_limiter
from app.api.v1.routes.health import router as health_router

api_router = APIRouter()
api_router.include_router(leads_router, prefix="/leads", tags=["leads"], dependencies=[Depends(get_current_user), Depends(rate_limiter())])
api_router.include_router(campaigns_router, prefix="/campaigns", tags=["campaigns"], dependencies=[Depends(get_current_user), Depends(rate_limiter())])
api_router.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(ai_router, prefix="/ai", tags=["ai"], dependencies=[Depends(get_current_user), Depends(rate_limiter())])
api_router.include_router(orchestrate_router, prefix="/orchestrate", tags=["orchestrate"], dependencies=[Depends(get_current_user), Depends(rate_limiter())])
api_router.include_router(jobs_router, prefix="/jobs", tags=["jobs"], dependencies=[Depends(get_current_user), Depends(rate_limiter())])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"], dependencies=[Depends(get_current_user), Depends(rate_limiter())])
api_router.include_router(scoring_router, prefix="/scoring", tags=["scoring"], dependencies=[Depends(get_current_user), Depends(rate_limiter())])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(health_router, tags=["health"]) 
