from sqlalchemy import String, Integer, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

class BusinessProfile(Base):
	__tablename__ = "business_profiles"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	industry: Mapped[str] = mapped_column(String(64), index=True, default="general")
	company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
	company_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
	services_offered: Mapped[str | None] = mapped_column(Text, nullable=True)
	greeting_script: Mapped[str | None] = mapped_column(Text, nullable=True)
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
