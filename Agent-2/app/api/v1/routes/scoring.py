from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.db import get_db
from app.models.lead import Lead
from app.models.lead_score import ScoringRule
from app.services.leads.scoring import lead_scoring_service

router = APIRouter()

class ScoringRuleCreate(BaseModel):
    name: str
    field: str
    condition: str
    value: str
    score: float
    is_active: bool = True

class ScoringRuleUpdate(BaseModel):
    name: str = None
    field: str = None
    condition: str = None
    value: str = None
    score: float = None
    is_active: bool = None

@router.post("/leads/{lead_id}/score")
async def calculate_lead_score(
    lead_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Calculate and update lead score"""
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Calculate score
    lead_score = await lead_scoring_service.calculate_lead_score(lead, db)
    
    # Qualify lead
    qualification = await lead_scoring_service.qualify_lead(lead, db)
    
    return {
        "lead_id": lead_id,
        "score": {
            "total_score": lead_score.total_score,
            "qualification_status": lead_score.qualification_status,
            "company_size_score": lead_score.company_size_score,
            "industry_score": lead_score.industry_score,
            "role_score": lead_score.role_score,
            "location_score": lead_score.location_score,
            "engagement_score": lead_score.engagement_score,
            "email_quality_score": lead_score.email_quality_score
        },
        "qualification": {
            "is_qualified": qualification.is_qualified,
            "reason": qualification.qualification_reason,
            "has_email": qualification.has_email,
            "has_linkedin": qualification.has_linkedin,
            "has_company_info": qualification.has_company_info,
            "has_role_info": qualification.has_role_info,
            "email_opened": qualification.email_opened,
            "email_clicked": qualification.email_clicked,
            "email_replied": qualification.email_replied
        }
    }

@router.post("/leads/{lead_id}/qualify")
async def qualify_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Qualify a lead based on data completeness and engagement"""
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    qualification = await lead_scoring_service.qualify_lead(lead, db)
    
    return {
        "lead_id": lead_id,
        "qualification": {
            "is_qualified": qualification.is_qualified,
            "reason": qualification.qualification_reason,
            "has_email": qualification.has_email,
            "has_linkedin": qualification.has_linkedin,
            "has_company_info": qualification.has_company_info,
            "has_role_info": qualification.has_role_info,
            "email_opened": qualification.email_opened,
            "email_clicked": qualification.email_clicked,
            "email_replied": qualification.email_replied
        }
    }

@router.get("/rules")
async def get_scoring_rules(db: AsyncSession = Depends(get_db)):
    """Get all active scoring rules"""
    rules = await lead_scoring_service.get_scoring_rules(db)
    return {"rules": [rule.__dict__ for rule in rules]}

@router.post("/rules")
async def create_scoring_rule(
    rule_data: ScoringRuleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new scoring rule"""
    rule = await lead_scoring_service.create_scoring_rule(rule_data.dict(), db)
    return {"rule": rule.__dict__}

@router.get("/leads/top-scored")
async def get_top_scored_leads(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Get top scored leads"""
    from sqlalchemy import select, desc
    
    result = await db.execute(
        select(Lead)
        .join(Lead.score)
        .order_by(desc(LeadScore.total_score))
        .limit(limit)
    )
    leads = list(result.scalars().all())
    
    return {
        "leads": [
            {
                "id": lead.id,
                "name": lead.name,
                "email": lead.email,
                "company": lead.company,
                "role": lead.role,
                "industry": lead.industry,
                "company_size": lead.company_size,
                "location": lead.location,
                "score": lead.score.total_score if lead.score else 0,
                "qualification_status": lead.score.qualification_status if lead.score else "unqualified"
            }
            for lead in leads
        ]
    }

@router.get("/leads/qualified")
async def get_qualified_leads(
    status: str = "qualified",  # qualified, hot, unqualified
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get leads by qualification status"""
    from sqlalchemy import select
    
    result = await db.execute(
        select(Lead)
        .join(Lead.score)
        .where(LeadScore.qualification_status == status)
        .limit(limit)
    )
    leads = list(result.scalars().all())
    
    return {
        "leads": [
            {
                "id": lead.id,
                "name": lead.name,
                "email": lead.email,
                "company": lead.company,
                "role": lead.role,
                "industry": lead.industry,
                "company_size": lead.company_size,
                "location": lead.location,
                "score": lead.score.total_score if lead.score else 0,
                "qualification_status": lead.score.qualification_status if lead.score else "unqualified"
            }
            for lead in leads
        ]
    }
