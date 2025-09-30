from sqlalchemy import String, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import func

from app.core.db import Base


class SchedulerLock(Base):
	__tablename__ = "scheduler_locks"

	name: Mapped[str] = mapped_column(String(64), primary_key=True)
	owner_token: Mapped[str | None] = mapped_column(String(64), nullable=True)
	expires_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SchedulerRun(Base):
	__tablename__ = "scheduler_runs"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	run_started_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	run_finished_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	owner_token: Mapped[str | None] = mapped_column(String(64), nullable=True)
	sent_count: Mapped[int] = mapped_column(Integer, default=0)
	failed_count: Mapped[int] = mapped_column(Integer, default=0)


