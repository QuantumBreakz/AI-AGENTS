from app.core.db import Base  # re-export
from app.models.lead import Lead
from app.models.campaign import Campaign, CampaignEmail, CampaignEmailVariant, CampaignRecipient
from app.models.applicant import ApplicantProfile, JobApplicationAttempt
from app.models.lead_score import LeadScore, ScoringRule, LeadQualification
from app.models.email_tracking import EmailMessageLog, CampaignRecipientEvent
from app.models.user import User
from app.models.locks import SchedulerLock, SchedulerRun
from app.models.scraping import SearchRun, LeadSource
