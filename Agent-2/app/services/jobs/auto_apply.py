from typing import Mapping, Any
from app.services.jobs.linkedin_jobs import LinkedInJobService
import logging

logger = logging.getLogger(__name__)

async def auto_apply_linkedin(profile: Mapping[str, Any], filters: Mapping[str, Any]) -> int:
    """
    Auto-apply to jobs on LinkedIn based on filters
    Returns count of successful applications
    """
    try:
        linkedin_service = LinkedInJobService()
        
        # Search for jobs matching the filters
        jobs = await linkedin_service.search_jobs(filters)
        
        applied_count = 0
        
        for job in jobs:
            try:
                # Check if job matches additional criteria
                if _job_matches_criteria(job, filters):
                    result = await linkedin_service.apply_to_job(job["id"], profile)
                    if result.get("success", False):
                        applied_count += 1
                        logger.info(f"Successfully applied to job: {job['title']} at {job['company']}")
                    else:
                        logger.warning(f"Failed to apply to job {job['id']}: {result.get('message')}")
                        
            except Exception as e:
                logger.error(f"Error applying to job {job['id']}: {str(e)}")
                continue
        
        logger.info(f"LinkedIn auto-apply completed: {applied_count} applications submitted")
        return applied_count
        
    except Exception as e:
        logger.error(f"LinkedIn auto-apply failed: {str(e)}")
        return 0

def _job_matches_criteria(job: Mapping[str, Any], filters: Mapping[str, Any]) -> bool:
    """Check if a job matches the specified criteria"""
    # Check salary
    if filters.get("salary_min") and job.get("salary", 0) < filters["salary_min"]:
        return False
    
    # Check company size (if available)
    company_size = filters.get("company_size")
    if company_size and job.get("company_size") != company_size:
        return False
    
    # Add more criteria as needed
    return True

async def auto_apply_handshake(profile: Mapping[str, Any], filters: Mapping[str, Any]) -> int:
    # Return count of applied jobs (stub)
    return 0
