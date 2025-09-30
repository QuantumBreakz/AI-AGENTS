from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

class Base(DeclarativeBase):
	pass

# Auto-select async driver
if settings.DATABASE_URL.startswith("sqlite") and "+aiosqlite" not in settings.DATABASE_URL:
	database_url = settings.DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")
else:
	database_url = settings.DATABASE_URL

engine = create_async_engine(database_url, future=True, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def init_db() -> None:
	# Import models to register metadata
	from app.models import lead, campaign  # noqa: F401
	from app.models import lead_note, lead_score  # noqa: F401
	from app.models import email_tracking  # noqa: F401
	from app.models import user  # noqa: F401
	from app.models import locks  # noqa: F401
	from app.models import scraping  # noqa: F401
	async with engine.begin() as conn:
		await conn.run_sync(Base.metadata.create_all)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
	async with AsyncSessionLocal() as session:
		yield session
