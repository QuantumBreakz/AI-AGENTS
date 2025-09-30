from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.services.campaigns.analytics import campaign_analytics_service
from sqlalchemy import select, desc
from app.models.locks import SchedulerLock, SchedulerRun

router = APIRouter()

@router.get("/campaigns/{campaign_id}/performance")
async def get_campaign_performance(
    campaign_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get performance metrics for a specific campaign"""
    return await campaign_analytics_service.get_campaign_performance(campaign_id, db)

@router.get("/campaigns/overview")
async def get_campaigns_overview(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """Get campaigns overview analytics"""
    return await campaign_analytics_service.get_overall_analytics(db, days)

@router.get("/overall")
async def get_overall_analytics(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """Get overall analytics across all campaigns"""
    return await campaign_analytics_service.get_overall_analytics(db, days)

@router.get("/leads")
async def get_lead_performance_analytics(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """Get lead performance analytics"""
    return await campaign_analytics_service.get_lead_performance_analytics(db, days)

@router.get("/leads/performance")
async def get_leads_performance(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """Get leads performance analytics (alias for /leads)"""
    return await campaign_analytics_service.get_lead_performance_analytics(db, days)

@router.get("/scheduler/health")
async def scheduler_health(db: AsyncSession = Depends(get_db)):
    """Expose scheduler lock ownership and expiration."""
    lock = await db.get(SchedulerLock, "campaign_scheduler")
    if not lock:
        out = {"locked": False}
    else:
        out = {
        "locked": bool(lock.owner_token),
        "owner_token": lock.owner_token,
        "expires_at": lock.expires_at.isoformat() if lock.expires_at else None,
    }
    # Add last run stats
    res = await db.execute(select(SchedulerRun).order_by(desc(SchedulerRun.id)).limit(1))
    last = res.scalars().first()
    if last:
        out.update({
            "last_run": {
                "started_at": last.run_started_at.isoformat() if last.run_started_at else None,
                "finished_at": last.run_finished_at.isoformat() if last.run_finished_at else None,
                "sent_count": last.sent_count,
                "failed_count": last.failed_count,
                "owner_token": last.owner_token,
            }
        })
    return out
