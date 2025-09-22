from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

class Lead(Base):
	__tablename__ = "leads"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	name: Mapped[str | None] = mapped_column(String(255), nullable=True)
	email: Mapped[str | None] = mapped_column(String(255), index=True)
	company: Mapped[str | None] = mapped_column(String(255), index=True)
	role: Mapped[str | None] = mapped_column(String(255), index=True)
	linkedin_url: Mapped[str | None] = mapped_column(String(512))
	source: Mapped[str | None] = mapped_column(String(64))
	company_size: Mapped[str | None] = mapped_column(String(64))
	industry: Mapped[str | None] = mapped_column(String(128))
	location: Mapped[str | None] = mapped_column(String(128))
	stage: Mapped[str] = mapped_column(String(64), default="new")
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
