from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
import logging

from app.models.campaign import Campaign, CampaignRecipient, CampaignEmail
from app.models.lead import Lead
from app.models.lead_score import LeadScore

logger = logging.getLogger(__name__)

class CampaignAnalyticsService:
    def __init__(self):
        pass

    async def get_campaign_performance(self, campaign_id: int, db: AsyncSession) -> Dict[str, Any]:
        """Get comprehensive campaign performance metrics"""
        
        campaign = await db.get(Campaign, campaign_id)
        if not campaign:
            return {"error": "Campaign not found"}
        
        # Get all recipients for this campaign
        recipients_result = await db.execute(
            select(CampaignRecipient).where(CampaignRecipient.campaign_id == campaign_id)
        )
        recipients = list(recipients_result.scalars().all())
        
        # Get campaign emails
        emails_result = await db.execute(
            select(CampaignEmail).where(CampaignEmail.campaign_id == campaign_id)
        )
        emails = list(emails_result.scalars().all())
        
        # Calculate metrics
        total_recipients = len(recipients)
        emails_sent = sum(1 for r in recipients if r.last_sent_at is not None)
        paused_recipients = sum(1 for r in recipients if r.paused)
        active_recipients = total_recipients - paused_recipients
        
        # Engagement metrics (simplified - would need webhook tracking for real data)
        replied_recipients = sum(1 for r in recipients if r.paused and r.current_step > 0)
        
        # Calculate rates
        delivery_rate = (emails_sent / total_recipients * 100) if total_recipients > 0 else 0
        reply_rate = (replied_recipients / emails_sent * 100) if emails_sent > 0 else 0
        
        # Lead quality metrics
        lead_scores = await self._get_lead_scores_for_campaign(campaign_id, db)
        avg_lead_score = sum(score.total_score for score in lead_scores) / len(lead_scores) if lead_scores else 0
        
        # Qualification metrics
        qualified_leads = sum(1 for score in lead_scores if score.qualification_status in ["qualified", "hot"])
        qualification_rate = (qualified_leads / len(lead_scores) * 100) if lead_scores else 0
        
        return {
            "campaign_id": campaign_id,
            "campaign_name": campaign.name,
            "offer": campaign.offer,
            "status": campaign.status,
            "created_at": campaign.created_at,
            "metrics": {
                "total_recipients": total_recipients,
                "emails_sent": emails_sent,
                "active_recipients": active_recipients,
                "paused_recipients": paused_recipients,
                "delivery_rate": round(delivery_rate, 2),
                "reply_rate": round(reply_rate, 2),
                "avg_lead_score": round(avg_lead_score, 2),
                "qualified_leads": qualified_leads,
                "qualification_rate": round(qualification_rate, 2)
            },
            "email_sequence": [
                {
                    "step": email.sequence_order,
                    "subject": email.subject_template,
                    "send_delay_hours": email.send_delay_hours,
                    "is_follow_up": email.is_follow_up
                }
                for email in emails
            ]
        }

    async def get_overall_analytics(self, db: AsyncSession, days: int = 30) -> Dict[str, Any]:
        """Get overall analytics across all campaigns"""
        
        # Date range
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Total campaigns
        campaigns_result = await db.execute(
            select(Campaign).where(Campaign.created_at >= start_date)
        )
        campaigns = list(campaigns_result.scalars().all())
        
        # Total recipients
        total_recipients = 0
        total_emails_sent = 0
        total_replies = 0
        
        campaign_performances = []
        
        for campaign in campaigns:
            recipients_result = await db.execute(
                select(CampaignRecipient).where(CampaignRecipient.campaign_id == campaign.id)
            )
            recipients = list(recipients_result.scalars().all())
            
            total_recipients += len(recipients)
            emails_sent = sum(1 for r in recipients if r.last_sent_at is not None)
            total_emails_sent += emails_sent
            replied = sum(1 for r in recipients if r.paused and r.current_step > 0)
            total_replies += replied
            
            campaign_performances.append({
                "campaign_id": campaign.id,
                "campaign_name": campaign.name,
                "recipients": len(recipients),
                "emails_sent": emails_sent,
                "replies": replied,
                "reply_rate": (replied / emails_sent * 100) if emails_sent > 0 else 0
            })
        
        # Lead quality metrics
        all_leads_result = await db.execute(
            select(Lead).where(Lead.created_at >= start_date)
        )
        all_leads = list(all_leads_result.scalars().all())
        
        lead_scores = await self._get_lead_scores_for_leads([lead.id for lead in all_leads], db)
        avg_lead_score = sum(score.total_score for score in lead_scores) / len(lead_scores) if lead_scores else 0
        
        # Top performing campaigns
        top_campaigns = sorted(campaign_performances, key=lambda x: x["reply_rate"], reverse=True)[:5]
        
        return {
            "period_days": days,
            "summary": {
                "total_campaigns": len(campaigns),
                "total_recipients": total_recipients,
                "total_emails_sent": total_emails_sent,
                "total_replies": total_replies,
                "overall_reply_rate": round((total_replies / total_emails_sent * 100) if total_emails_sent > 0 else 0, 2),
                "avg_lead_score": round(avg_lead_score, 2)
            },
            "top_performing_campaigns": top_campaigns,
            "all_campaigns": campaign_performances
        }

    async def get_lead_performance_analytics(self, db: AsyncSession, days: int = 30) -> Dict[str, Any]:
        """Get lead performance analytics"""
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get all leads from the period
        leads_result = await db.execute(
            select(Lead).where(Lead.created_at >= start_date)
        )
        leads = list(leads_result.scalars().all())
        
        # Get lead scores
        lead_scores = await self._get_lead_scores_for_leads([lead.id for lead in leads], db)
        
        # Score distribution
        score_ranges = {
            "hot": sum(1 for score in lead_scores if score.total_score >= 80),
            "qualified": sum(1 for score in lead_scores if 60 <= score.total_score < 80),
            "unqualified": sum(1 for score in lead_scores if score.total_score < 60)
        }
        
        # Industry breakdown
        industry_stats = {}
        for lead in leads:
            industry = lead.industry or "Unknown"
            if industry not in industry_stats:
                industry_stats[industry] = {"count": 0, "avg_score": 0, "scores": []}
            industry_stats[industry]["count"] += 1
            
            # Find corresponding score
            lead_score = next((score for score in lead_scores if score.lead_id == lead.id), None)
            if lead_score:
                industry_stats[industry]["scores"].append(lead_score.total_score)
        
        # Calculate average scores per industry
        for industry in industry_stats:
            scores = industry_stats[industry]["scores"]
            industry_stats[industry]["avg_score"] = round(sum(scores) / len(scores), 2) if scores else 0
            del industry_stats[industry]["scores"]  # Remove raw scores
        
        # Company size breakdown
        company_size_stats = {}
        for lead in leads:
            size = lead.company_size or "Unknown"
            if size not in company_size_stats:
                company_size_stats[size] = {"count": 0, "avg_score": 0, "scores": []}
            company_size_stats[size]["count"] += 1
            
            lead_score = next((score for score in lead_scores if score.lead_id == lead.id), None)
            if lead_score:
                company_size_stats[size]["scores"].append(lead_score.total_score)
        
        for size in company_size_stats:
            scores = company_size_stats[size]["scores"]
            company_size_stats[size]["avg_score"] = round(sum(scores) / len(scores), 2) if scores else 0
            del company_size_stats[size]["scores"]
        
        return {
            "period_days": days,
            "total_leads": len(leads),
            "score_distribution": score_ranges,
            "industry_breakdown": industry_stats,
            "company_size_breakdown": company_size_stats,
            "overall_avg_score": round(sum(score.total_score for score in lead_scores) / len(lead_scores), 2) if lead_scores else 0
        }

    async def _get_lead_scores_for_campaign(self, campaign_id: int, db: AsyncSession) -> List[LeadScore]:
        """Get lead scores for all leads in a campaign"""
        # Get recipient lead IDs
        recipients_result = await db.execute(
            select(CampaignRecipient.lead_id).where(CampaignRecipient.campaign_id == campaign_id)
        )
        lead_ids = [row[0] for row in recipients_result.fetchall()]
        
        if not lead_ids:
            return []
        
        # Get lead scores
        scores_result = await db.execute(
            select(LeadScore).where(LeadScore.lead_id.in_(lead_ids))
        )
        return list(scores_result.scalars().all())

    async def _get_lead_scores_for_leads(self, lead_ids: List[int], db: AsyncSession) -> List[LeadScore]:
        """Get lead scores for specific lead IDs"""
        if not lead_ids:
            return []
        
        scores_result = await db.execute(
            select(LeadScore).where(LeadScore.lead_id.in_(lead_ids))
        )
        return list(scores_result.scalars().all())

# Global instance
campaign_analytics_service = CampaignAnalyticsService()
