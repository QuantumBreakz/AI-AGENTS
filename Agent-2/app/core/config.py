from pydantic_settings import BaseSettings, SettingsConfigDict
import os
import logging
from typing import ClassVar

logger = logging.getLogger(__name__)

def find_env_file() -> str | None:
	"""Find the first existing .env file in multiple locations"""
	# Get the directory where this config.py file is located
	current_dir = os.path.dirname(__file__)
	
	env_files = [
		# Agent-2/.env (most likely location)
		os.path.join(current_dir, "..", "..", ".env"),
		# Current working directory
		".env",
		# Parent directory
		"../.env",
		# Root directory
		"../../.env",
		# Absolute paths for Agent-2
		"/Users/aliahmed/Downloads/Upwork/Agents/Agent-2/.env",
		# Absolute path for root
		"/Users/aliahmed/Downloads/Upwork/Agents/.env",
	]
	
	# Remove duplicates while preserving order
	seen = set()
	unique_env_files = []
	for path in env_files:
		if path not in seen:
			seen.add(path)
			unique_env_files.append(path)
	
	for env_path in unique_env_files:
		abs_path = os.path.abspath(env_path)
		if os.path.exists(abs_path):
			logger.info(f"📁 Found .env file at: {abs_path}")
			return abs_path
	
	logger.warning("⚠️ No .env file found in any of the expected locations")
	logger.info(f"🔍 Searched locations: {[os.path.abspath(p) for p in unique_env_files]}")
	return None

class Settings(BaseSettings):
	DATABASE_URL: str = "sqlite+aiosqlite:///./data.db"
	OPENAI_API_KEY: str | None = None
	OPENAI_BASE_URL: str | None = None
	OPENAI_MODEL: str = "gpt-4o-mini"
	ENABLE_OPENAI: bool = False
	APOLLO_API_KEY: str | None = None
	CRUNCHBASE_API_KEY: str | None = None
	SERPAPI_API_KEY: str | None = None
	PROXYCURL_API_KEY: str | None = None
	EMAIL_WEBHOOK_SECRET: str | None = None
	# LinkedIn Job Application API
	LINKEDIN_CLIENT_ID: str | None = None
	LINKEDIN_CLIENT_SECRET: str | None = None
	# Email providers
	EMAIL_PROVIDER: str = "gmail"  # gmail | ses | sendgrid
	SES_REGION: str | None = None
	SENDGRID_API_KEY: str | None = None
	EMAIL_FROM: str | None = None
	# Additional API keys from environment
	# CRM and Integrations
	ZOHO_API_KEY: str | None = None  # legacy; prefer ZOHO_ACCESS_TOKEN
	ZOHO_ACCESS_TOKEN: str | None = None
	PIPEDRIVE_API_KEY: str | None = None  # legacy; prefer PIPEDRIVE_API_TOKEN
	PIPEDRIVE_API_TOKEN: str | None = None
	HUBSPOT_API_KEY: str | None = None
	# Salesforce credentials
	SALESFORCE_CLIENT_ID: str | None = None
	SALESFORCE_CLIENT_SECRET: str | None = None
	SALESFORCE_USERNAME: str | None = None
	SALESFORCE_PASSWORD: str | None = None
	SALESFORCE_TOKEN: str | None = None
	ELEVEN_LABS_API_KEY: str | None = None
	GOOGLE_CALENDAR_API_KEY: str | None = None
	GMAIL_SMTP_API_KEY: str | None = None
	ENABLED_CRMS: str | None = None
	ENABLED_SCRAPERS: str | None = None
	# Data integrity controls
	REQUIRE_REAL_DATA: bool = True
	# App settings
	PROJECT_NAME: str = "Agent-2"
	API_PREFIX: str = "/api/v1"

	model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
		env_file=find_env_file(), 
		env_file_encoding="utf-8", 
		extra="ignore"
	)

settings = Settings()

# --- Environment normalization helpers & fallbacks ---
def _env_any(*names: str) -> str | None:
	for n in names:
		v = os.getenv(n)
		if v:
			return v
	return None

# Accept common alternative env var names
if not settings.OPENAI_API_KEY:
	settings.OPENAI_API_KEY = _env_any("OPENAI_KEY", "OPENAI_API_TOKEN")
if not settings.OPENAI_BASE_URL:
	settings.OPENAI_BASE_URL = _env_any("OPENAI_API_BASE", "OPENAI_BASE_URL")
if settings.OPENAI_API_KEY and not settings.ENABLE_OPENAI:
	settings.ENABLE_OPENAI = True

if not settings.APOLLO_API_KEY:
	settings.APOLLO_API_KEY = _env_any("APOLLO_KEY")
if not settings.CRUNCHBASE_API_KEY:
	settings.CRUNCHBASE_API_KEY = _env_any("CRUNCHBASE_KEY")
if not settings.PROXYCURL_API_KEY:
	settings.PROXYCURL_API_KEY = _env_any("PROXYCURL_KEY", "PROXYCURL_TOKEN", "LINKEDIN_API_KEY")
if not settings.SERPAPI_API_KEY:
	settings.SERPAPI_API_KEY = _env_any("SERPAPI_KEY", "SERP_API_KEY")

if not settings.SENDGRID_API_KEY:
	settings.SENDGRID_API_KEY = _env_any("SENDGRID_KEY")
if not settings.PIPEDRIVE_API_TOKEN:
	settings.PIPEDRIVE_API_TOKEN = _env_any("PIPEDRIVE_API_KEY", "PIPEDRIVE_TOKEN")
if not settings.ZOHO_ACCESS_TOKEN:
	settings.ZOHO_ACCESS_TOKEN = _env_any("ZOHO_API_KEY", "ZOHO_TOKEN")
if not settings.HUBSPOT_API_KEY:
	settings.HUBSPOT_API_KEY = _env_any("HUBSPOT_KEY")