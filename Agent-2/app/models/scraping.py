from sqlalchemy import Integer, String, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class SearchRun(Base):
	__tablename__ = "search_runs"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	query: Mapped[dict] = mapped_column(JSON)
	providers_requested: Mapped[dict | None] = mapped_column(JSON, nullable=True)
	providers_used: Mapped[dict | None] = mapped_column(JSON, nullable=True)
	status: Mapped[str] = mapped_column(String(32), default="completed")  # completed, partial, failed
	errors: Mapped[dict | None] = mapped_column(JSON, nullable=True)
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LeadSource(Base):
	__tablename__ = "lead_sources"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	search_run_id: Mapped[int] = mapped_column(ForeignKey("search_runs.id", ondelete="CASCADE"), index=True)
	provider: Mapped[str] = mapped_column(String(64))
	lead_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
	data: Mapped[dict] = mapped_column(JSON)
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


