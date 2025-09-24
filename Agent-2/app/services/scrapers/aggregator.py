from typing import Mapping, Any, Iterable, List, Dict, Set
import logging

from app.services.scrapers.providers.apollo import ApolloScraper
from app.services.scrapers.providers.crunchbase import CrunchbaseScraper
from app.services.scrapers.providers.proxycurl import ProxycurlLinkedInScraper
from app.services.scrapers.providers.serpapi_clutch import SerpapiClutchScraper
from app.core.config import settings

logger = logging.getLogger(__name__)

NORMALIZED_FIELDS = ["name", "email", "company", "role", "linkedin_url", "source", "company_size", "industry", "location"]

def normalize(record: Mapping[str, Any]) -> Dict[str, Any]:
	out = {k: record.get(k) for k in NORMALIZED_FIELDS}
	return out

def generate_mock_leads(query: Mapping[str, Any], count: int = 5) -> List[Dict[str, Any]]:
	"""Generate mock leads when no API keys are configured or APIs fail"""
	import random
	
	mock_companies = [
		"TechCorp Solutions", "InnovateLab", "DataDrive Inc", "CloudFirst Systems", 
		"AI Dynamics", "NextGen Technologies", "Digital Solutions Co", "Future Systems",
		"SmartTech Industries", "CyberSecure Corp", "StartupXYZ", "TechGiant Inc",
		"CloudScale", "DataMinds", "InnovationHub", "TechForward"
	]
	
	mock_roles = [
		"CTO", "VP Engineering", "Head of Product", "Senior Developer", "Tech Lead",
		"Product Manager", "Engineering Manager", "Solutions Architect", "DevOps Lead",
		"Software Engineer", "Full Stack Developer", "Data Scientist", "ML Engineer"
	]
	
	mock_industries = [
		"Technology", "Software", "SaaS", "Fintech", "Healthcare Tech", 
		"E-commerce", "AI/ML", "Cybersecurity", "Cloud Computing", "Mobile Apps",
		"Blockchain", "IoT", "Automotive Tech"
	]
	
	mock_locations = [
		"San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", 
		"Boston, MA", "Chicago, IL", "Los Angeles, CA", "Denver, CO", "Remote",
		"London, UK", "Berlin, Germany", "Toronto, Canada"
	]
	
	results = []
	for i in range(count):
		company = random.choice(mock_companies)
		role = query.get("role") or random.choice(mock_roles)
		industry = query.get("industry") or random.choice(mock_industries)
		location = query.get("location") or random.choice(mock_locations)
		company_size = query.get("company_size") or random.choice(["startup", "small", "medium", "large", "enterprise"])
		
		results.append({
			"name": f"Lead {i+1}",
			"email": f"lead{i+1}@{company.lower().replace(' ', '')}.com",
			"company": company,
			"role": role,
			"linkedin_url": f"https://linkedin.com/in/lead{i+1}",
			"source": "mock",
			"company_size": company_size,
			"industry": industry,
			"location": location,
		})
	
	return results

async def aggregate_search(query: Mapping[str, Any], providers: List[str] | None = None) -> List[Dict[str, Any]]:
	"""Aggregate search results from multiple lead scraping providers"""
	
	logger.info(f"🔍 Starting lead search with query: {query}")
	
	provider_map = {
		"apollo": ApolloScraper(),
		"crunchbase": CrunchbaseScraper(),
		"linkedin": ProxycurlLinkedInScraper(),
		"clutch": SerpapiClutchScraper(),
	}
	
	# Check for explicitly configured providers
	configured = set(filter(None, (settings.ENABLED_SCRAPERS or "").lower().split(",")))
	logger.info(f"📋 Explicitly configured scrapers: {configured}")
	
	# If not explicitly configured, auto-detect providers based on available API keys
	if not configured:
		logger.info("🔧 No explicitly configured scrapers, auto-detecting based on API keys...")
		
		# Check each API key
		apollo_available = bool(settings.APOLLO_API_KEY)
		crunchbase_available = bool(settings.CRUNCHBASE_API_KEY)
		proxycurl_available = bool(settings.PROXYCURL_API_KEY)
		serpapi_available = bool(settings.SERPAPI_API_KEY)
		
		logger.info(f"🔑 API key status - Apollo: {apollo_available}, Crunchbase: {crunchbase_available}, ProxyCurl: {proxycurl_available}, SerpAPI: {serpapi_available}")
		
		if apollo_available:
			configured.add("apollo")
		if crunchbase_available:
			configured.add("crunchbase")
		if proxycurl_available:
			configured.add("linkedin")
		if serpapi_available:
			configured.add("clutch")
	
	default_set = list(configured) if configured else []
	selected = providers if providers is not None else default_set
	
	logger.info(f"✅ Final selected scrapers: {selected}")
	
	# If no providers selected, use mock data
	if not selected:
		logger.warning("⚠️ No scrapers available, using mock data")
		return generate_mock_leads(query, count=10)
	
	results: List[Dict[str, Any]] = []
	seen: Set[str] = set()
	errors = []
	successful_scrapers = []
	
	for name in selected:
		scraper = provider_map.get(name)
		if not scraper:
			logger.warning(f"❌ Unknown scraper: {name}")
			continue
		
		logger.info(f"🚀 Running scraper: {name}")
		try:
			scraper_results = []
			result_count = 0
			
			async for rec in scraper.search(query):
				n = normalize(rec)
				key = (n.get("email") or "").lower() or (n.get("linkedin_url") or "").lower()
				if not key or key in seen:
					continue
				seen.add(key)
				scraper_results.append(n)
				result_count += 1
			
			logger.info(f"✅ Scraper {name} returned {result_count} results")
			results.extend(scraper_results)
			successful_scrapers.append(name)
			
		except Exception as e:
			error_msg = f"❌ Scraper {name} failed: {str(e)}"
			logger.error(error_msg, exc_info=True)
			errors.append(error_msg)
	
	# If no results from any scraper, fall back to mock data
	if not results:
		logger.warning("⚠️ No results from any scraper, using mock data as fallback")
		results = generate_mock_leads(query, count=10)
	
	logger.info(f"🎉 Search complete - Total results: {len(results)}, Successful scrapers: {successful_scrapers}")
	if errors:
		logger.warning(f"⚠️ Scraper errors: {errors}")
	
	return results