from pydantic_settings import BaseSettings, SettingsConfigDict

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

	model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
