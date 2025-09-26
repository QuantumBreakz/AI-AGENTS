from pydantic_settings import BaseSettings, SettingsConfigDict
import os
import logging

logger = logging.getLogger(__name__)

def find_env_file() -> str | None:
	"""Find the first existing .env file in multiple locations"""
	# Get the directory where this config.py file is located
	current_dir = os.path.dirname(__file__)
	
	env_files = [
		# Agent-3/.env (most likely location)
		os.path.join(current_dir, "..", "..", ".env"),
		# Current working directory
		".env",
		# Parent directory
		"../.env",
		# Root directory
		"../../.env",
		# Absolute paths for Agent-3
		"/Users/aliahmed/Downloads/Upwork/Agents/Agent-3/.env",
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
	DATABASE_URL: str = "sqlite+aiosqlite:///./agent3.db"
	OPENAI_API_KEY: str | None = None
	OPENAI_BASE_URL: str | None = None
	OPENAI_MODEL: str = "gpt-4o-mini"
	TWILIO_ACCOUNT_SID: str | None = None
	TWILIO_AUTH_TOKEN: str | None = None
	TWILIO_FROM_NUMBER: str | None = None
	PUBLIC_BASE_URL: str | None = None
	HUMAN_AGENT_NUMBER: str | None = None
	HUBSPOT_API_KEY: str | None = None
	GOOGLE_CALENDAR_ACCESS_TOKEN: str | None = None
	GOOGLE_CALENDAR_ID: str | None = None
	TWILIO_VALIDATE_SIGNATURE: bool = False
	ENABLED_CRMS: str = "mock"

	model_config = SettingsConfigDict(
		env_file=find_env_file(), 
		env_file_encoding="utf-8", 
		extra="ignore"
	)

settings = Settings()
