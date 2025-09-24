from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.services.campaigns.analytics import campaign_analytics_service

router = APIRouter()

@router.get("/campaigns/{campaign_id}/performance")
async def get_campaign_performance(
    campaign_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get performance metrics for a specific campaign"""
    return await campaign_analytics_service.get_campaign_performance(campaign_id, db)

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
