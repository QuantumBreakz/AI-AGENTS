from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
	DATABASE_URL: str = "sqlite+aiosqlite:///./data.db"
	OPENAI_API_KEY: str | None = None
	OPENAI_BASE_URL: str | None = None
	OPENAI_MODEL: str = "gpt-4o-mini"
	APOLLO_API_KEY: str | None = None
	CRUNCHBASE_API_KEY: str | None = None
	SERPAPI_API_KEY: str | None = None
	PROXYCURL_API_KEY: str | None = None
	EMAIL_WEBHOOK_SECRET: str | None = None
	# Email providers
	EMAIL_PROVIDER: str = "ses"  # ses | sendgrid
	SES_REGION: str | None = None
	SENDGRID_API_KEY: str | None = None
	EMAIL_FROM: str | None = None
	# Additional API keys from environment
	ZOHO_API_KEY: str | None = None
	ELEVEN_LABS_API_KEY: str | None = None
	GOOGLE_CALENDAR_API_KEY: str | None = None
	PIPEDRIVE_API_KEY: str | None = None
	HUBSPOT_API_KEY: str | None = None
	GMAIL_SMTP_API_KEY: str | None = None
	# App settings
	PROJECT_NAME: str = "Agent-2"
	API_PREFIX: str = "/api/v1"

	model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
