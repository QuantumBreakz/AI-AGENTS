from sqlalchemy import String, Integer, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

class ApplicantProfile(Base):
	__tablename__ = "applicant_profiles"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	name: Mapped[str | None] = mapped_column(String(255))
	email: Mapped[str | None] = mapped_column(String(255))
	resume_path: Mapped[str | None] = mapped_column(String(1024))
	job_title_pref: Mapped[str | None] = mapped_column(String(255))
	location_pref: Mapped[str | None] = mapped_column(String(255))
	salary_min: Mapped[int | None] = mapped_column(Integer)
	company_size_pref: Mapped[str | None] = mapped_column(String(64))
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class JobApplicationAttempt(Base):
	__tablename__ = "job_application_attempts"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	provider: Mapped[str] = mapped_column(String(64))
	job_ref: Mapped[str | None] = mapped_column(String(1024))
	status: Mapped[str] = mapped_column(String(32), default="pending")
	response: Mapped[str | None] = mapped_column(Text)
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
