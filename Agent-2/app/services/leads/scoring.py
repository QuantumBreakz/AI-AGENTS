from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.models.lead import Lead
from app.models.lead_score import LeadScore, ScoringRule, LeadQualification

logger = logging.getLogger(__name__)

class LeadScoringService:
    def __init__(self):
        # Default scoring weights
        self.weights = {
            "company_size": 0.25,
            "industry": 0.20,
            "role": 0.20,
            "location": 0.15,
            "engagement": 0.10,
            "email_quality": 0.10
        }
        
        # Default scoring criteria
        self.default_rules = {
            "company_size": {
                "enterprise": 100,
                "large": 80,
                "medium": 60,
                "small": 40,
                "startup": 20
            },
            "industry": {
                "technology": 90,
                "finance": 85,
                "healthcare": 80,
                "manufacturing": 70,
                "retail": 60,
                "other": 50
            },
            "role": {
                "ceo": 100,
                "cto": 95,
                "vp": 90,
                "director": 80,
                "manager": 70,
                "senior": 60,
                "other": 50
            },
            "location": {
                "san francisco": 90,
                "new york": 85,
                "london": 80,
                "seattle": 75,
                "boston": 70,
                "other": 50
            }
        }

    async def calculate_lead_score(self, lead: Lead, db: AsyncSession) -> LeadScore:
        """Calculate comprehensive lead score"""
        
        # Get or create lead score record
        result = await db.execute(select(LeadScore).where(LeadScore.lead_id == lead.id))
        lead_score = result.scalar_one_or_none()
        
        if not lead_score:
            lead_score = LeadScore(lead_id=lead.id)
            db.add(lead_score)
        
        # Calculate individual scores
        lead_score.company_size_score = self._calculate_company_size_score(lead.company_size)
        lead_score.industry_score = self._calculate_industry_score(lead.industry)
        lead_score.role_score = self._calculate_role_score(lead.role)
        lead_score.location_score = self._calculate_location_score(lead.location)
        lead_score.email_quality_score = self._calculate_email_quality_score(lead.email)
        
        # Get engagement score from qualification data
        qualification = await self._get_qualification(lead.id, db)
        lead_score.engagement_score = self._calculate_engagement_score(qualification)
        
        # Calculate total weighted score
        lead_score.total_score = (
            lead_score.company_size_score * self.weights["company_size"] +
            lead_score.industry_score * self.weights["industry"] +
            lead_score.role_score * self.weights["role"] +
            lead_score.location_score * self.weights["location"] +
            lead_score.engagement_score * self.weights["engagement"] +
            lead_score.email_quality_score * self.weights["email_quality"]
        )
        
        # Determine qualification status
        lead_score.qualification_status = self._determine_qualification_status(lead_score.total_score)
        
        await db.commit()
        await db.refresh(lead_score)
        
        return lead_score

    async def qualify_lead(self, lead: Lead, db: AsyncSession) -> LeadQualification:
        """Qualify lead based on data completeness and engagement"""
        
        # Get or create qualification record
        result = await db.execute(select(LeadQualification).where(LeadQualification.lead_id == lead.id))
        qualification = result.scalar_one_or_none()
        
        if not qualification:
            qualification = LeadQualification(lead_id=lead.id)
            db.add(qualification)
        
        # Check data completeness
        qualification.has_email = bool(lead.email)
        qualification.has_linkedin = bool(lead.linkedin_url)
        qualification.has_company_info = bool(lead.company)
        qualification.has_role_info = bool(lead.role)
        
        # Determine if qualified
        qualification.is_qualified = self._is_lead_qualified(qualification)
        qualification.qualification_reason = self._get_qualification_reason(qualification)
        
        await db.commit()
        await db.refresh(qualification)
        
        return qualification

    def _calculate_company_size_score(self, company_size: Optional[str]) -> float:
        """Calculate score based on company size"""
        if not company_size:
            return 0.0
        
        size_lower = company_size.lower()
        return self.default_rules["company_size"].get(size_lower, 50)

    def _calculate_industry_score(self, industry: Optional[str]) -> float:
        """Calculate score based on industry"""
        if not industry:
            return 0.0
        
        industry_lower = industry.lower()
        for key, score in self.default_rules["industry"].items():
            if key in industry_lower:
                return score
        return self.default_rules["industry"]["other"]

    def _calculate_role_score(self, role: Optional[str]) -> float:
        """Calculate score based on role"""
        if not role:
            return 0.0
        
        role_lower = role.lower()
        for key, score in self.default_rules["role"].items():
            if key in role_lower:
                return score
        return self.default_rules["role"]["other"]

    def _calculate_location_score(self, location: Optional[str]) -> float:
        """Calculate score based on location"""
        if not location:
            return 0.0
        
        location_lower = location.lower()
        for key, score in self.default_rules["location"].items():
            if key in location_lower:
                return score
        return self.default_rules["location"]["other"]

    def _calculate_email_quality_score(self, email: Optional[str]) -> float:
        """Calculate score based on email quality"""
        if not email:
            return 0.0
        
        # Check for common business email patterns
        business_domains = [
            "gmail.com", "yahoo.com", "hotmail.com", "outlook.com"
        ]
        
        domain = email.split("@")[-1].lower() if "@" in email else ""
        
        if domain in business_domains:
            return 60  # Personal email
        elif domain:
            return 90  # Business email
        else:
            return 0

    def _calculate_engagement_score(self, qualification: Optional[LeadQualification]) -> float:
        """Calculate engagement score"""
        if not qualification:
            return 0.0
        
        score = 0.0
        
        # Email engagement
        if qualification.email_opened:
            score += 30
        if qualification.email_clicked:
            score += 40
        if qualification.email_replied:
            score += 100
        
        return min(score, 100.0)

    def _determine_qualification_status(self, total_score: float) -> str:
        """Determine qualification status based on total score"""
        if total_score >= 80:
            return "hot"
        elif total_score >= 60:
            return "qualified"
        else:
            return "unqualified"

    def _is_lead_qualified(self, qualification: LeadQualification) -> bool:
        """Determine if lead meets minimum qualification criteria"""
        # Must have email and either company or role info
        has_basic_info = qualification.has_email and (qualification.has_company_info or qualification.has_role_info)
        
        # Must have some engagement or be a high-value prospect
        has_engagement = qualification.email_replied or qualification.email_clicked
        
        return has_basic_info and (has_engagement or qualification.has_linkedin)

    def _get_qualification_reason(self, qualification: LeadQualification) -> str:
        """Get human-readable qualification reason"""
        reasons = []
        
        if not qualification.has_email:
            reasons.append("No email address")
        if not qualification.has_company_info and not qualification.has_role_info:
            reasons.append("Insufficient company/role information")
        
        if qualification.email_replied:
            reasons.append("Email replied - high engagement")
        elif qualification.email_clicked:
            reasons.append("Email clicked - good engagement")
        elif qualification.email_opened:
            reasons.append("Email opened - some engagement")
        
        if qualification.has_linkedin:
            reasons.append("LinkedIn profile available")
        
        return "; ".join(reasons) if reasons else "Meets qualification criteria"

    async def _get_qualification(self, lead_id: int, db: AsyncSession) -> Optional[LeadQualification]:
        """Get qualification record for lead"""
        result = await db.execute(select(LeadQualification).where(LeadQualification.lead_id == lead_id))
        return result.scalar_one_or_none()

    async def get_scoring_rules(self, db: AsyncSession) -> list[ScoringRule]:
        """Get all active scoring rules"""
        result = await db.execute(select(ScoringRule).where(ScoringRule.is_active == True))
        return list(result.scalars().all())

    async def create_scoring_rule(self, rule_data: Dict[str, Any], db: AsyncSession) -> ScoringRule:
        """Create a new scoring rule"""
        rule = ScoringRule(**rule_data)
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        return rule

# Global instance
lead_scoring_service = LeadScoringService()
