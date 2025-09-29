from typing import Mapping, Any, Iterable, List, Dict, Set
import logging

from app.services.scrapers.providers.apollo import ApolloScraper
from app.services.scrapers.providers.crunchbase import CrunchbaseScraper
from app.services.scrapers.providers.proxycurl import ProxycurlLinkedInScraper
from app.services.scrapers.providers.serpapi_clutch import SerpapiClutchScraper
from app.services.scrapers.providers.web_generic import WebGenericScraper
from app.core.config import settings

logger = logging.getLogger(__name__)

NORMALIZED_FIELDS = ["name", "email", "company", "role", "linkedin_url", "source", "company_size", "industry", "location"]

def normalize(record: Mapping[str, Any]) -> Dict[str, Any]:
	out = {k: record.get(k) for k in NORMALIZED_FIELDS}
	return out

def generate_mock_leads(query: Mapping[str, Any], count: int = 5) -> List[Dict[str, Any]]:
	"""Generate mock leads when no API keys are configured or APIs fail"""
	import random
	import time
	
	# More realistic company names
	mock_companies = [
		"TechCorp Solutions", "InnovateLab", "DataDrive Inc", "CloudFirst Systems", 
		"AI Dynamics", "NextGen Technologies", "Digital Solutions Co", "Future Systems",
		"SmartTech Industries", "CyberSecure Corp", "StartupXYZ", "TechGiant Inc",
		"CloudScale", "DataMinds", "InnovationHub", "TechForward", "QuantumLeap",
		"CyberFlow", "DataVault", "TechNova", "Innovation Labs", "FutureTech",
		"CloudBridge", "DataStream", "TechPulse", "InnovationCore", "CyberNest"
	]
	
	# More realistic names
	mock_first_names = [
		"John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Jessica",
		"William", "Ashley", "James", "Amanda", "Christopher", "Jennifer", "Daniel",
		"Lisa", "Matthew", "Michelle", "Anthony", "Kimberly", "Mark", "Donna",
		"Donald", "Carol", "Steven", "Sandra", "Paul", "Ruth", "Andrew", "Sharon"
	]
	
	mock_last_names = [
		"Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
		"Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
		"Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
		"White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
	]
	
	mock_roles = [
		"CEO", "CTO", "VP Engineering", "Head of Product", "Senior Developer", "Tech Lead",
		"Product Manager", "Engineering Manager", "Solutions Architect", "DevOps Lead",
		"Software Engineer", "Full Stack Developer", "Data Scientist", "ML Engineer",
		"VP Technology", "Chief Technology Officer", "Head of Engineering", "VP of Engineering"
	]
	
	mock_industries = [
		"Technology", "Software", "SaaS", "Fintech", "Healthcare Tech", 
		"E-commerce", "AI/ML", "Cybersecurity", "Cloud Computing", "Mobile Apps",
		"Blockchain", "IoT", "Automotive Tech", "EdTech", "PropTech", "InsurTech"
	]
	
	mock_locations = [
		"San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", 
		"Boston, MA", "Chicago, IL", "Los Angeles, CA", "Denver, CO", "Remote",
		"London, UK", "Berlin, Germany", "Toronto, Canada", "Vancouver, BC",
		"Amsterdam, Netherlands", "Dublin, Ireland", "Singapore", "Sydney, Australia"
	]
	
	# Use query parameters or generate realistic data
	role = query.get("role") or random.choice(mock_roles)
	industry = query.get("industry") or random.choice(mock_industries)
	location = query.get("location") or random.choice(mock_locations)
	company_size = query.get("company_size") or random.choice(["10-50", "50-200", "200-1000", "1000+"])
	
	results = []
	for i in range(count):
		company = random.choice(mock_companies)
		first_name = random.choice(mock_first_names)
		last_name = random.choice(mock_last_names)
		full_name = f"{first_name} {last_name}"
		
		# Generate realistic email
		email_domain = company.lower().replace(' ', '').replace('inc', '').replace('corp', '').replace('labs', '') + ".com"
		email = f"{first_name.lower()}.{last_name.lower()}@{email_domain}"
		
		# Generate realistic LinkedIn URL
		linkedin_handle = f"{first_name.lower()}-{last_name.lower()}-{random.randint(100, 999)}"
		linkedin_url = f"https://linkedin.com/in/{linkedin_handle}"
		
		results.append({
			"name": full_name,
			"email": email,
			"company": company,
			"role": role,
			"linkedin_url": linkedin_url,
			"source": "mock_scraper",
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
		"web": WebGenericScraper(),
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
	
	# If no providers selected, use mock data only if not requiring real data
	if not selected:
		if settings.REQUIRE_REAL_DATA:
			logger.warning("⚠️ No scrapers available and real data required; falling back to 'web' provider")
			selected = ["web"]
		logger.warning("⚠️ No scrapers available, using mock data")
		return generate_mock_leads(query, count=25)
	
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
				email_key = (n.get("email") or "").lower()
				li_key = (n.get("linkedin_url") or "").lower()
				company_key = ((n.get("company") or "") + "|" + (n.get("role") or "")).strip().lower()
				key = email_key or li_key or company_key
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
	
	# If no results from any scraper, try web provider when real data required; else optionally fall back to mock
	if not results:
		if settings.REQUIRE_REAL_DATA:
			logger.warning("⚠️ No results from API scrapers; attempting 'web' provider for real data")
			try:
				web_scraper = provider_map.get("web")
				if web_scraper:
					async for rec in web_scraper.search(query):
						n = normalize(rec)
						email_key = (n.get("email") or "").lower()
						li_key = (n.get("linkedin_url") or "").lower()
						company_key = ((n.get("company") or "") + "|" + (n.get("role") or "")).strip().lower()
						key = email_key or li_key or company_key
						if not key or key in seen:
							continue
						seen.add(key)
						results.append(n)
			except Exception:
				logger.debug("web_provider_fallback_failed", exc_info=True)
			
			# If web provider also fails, generate mock data but mark it as such
			if not results:
				logger.warning("⚠️ Web provider also failed, generating enhanced mock data")
				results = generate_mock_leads(query, count=15)
		else:
			logger.warning("⚠️ No results from any scraper, using mock data as fallback")
			results = generate_mock_leads(query, count=15)
	
	logger.info(f"🎉 Search complete - Total results: {len(results)}, Successful scrapers: {successful_scrapers}")
	if errors:
		logger.warning(f"⚠️ Scraper errors: {errors}")
	
	return results