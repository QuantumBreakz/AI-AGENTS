from sqlalchemy import String, Integer, Float, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

class LeadScore(Base):
	__tablename__ = "lead_scores"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), index=True)
	
	# Scoring factors
	company_size_score: Mapped[float] = mapped_column(Float, default=0.0)
	industry_score: Mapped[float] = mapped_column(Float, default=0.0)
	role_score: Mapped[float] = mapped_column(Float, default=0.0)
	location_score: Mapped[float] = mapped_column(Float, default=0.0)
	engagement_score: Mapped[float] = mapped_column(Float, default=0.0)
	email_quality_score: Mapped[float] = mapped_column(Float, default=0.0)
	
	# Calculated scores
	total_score: Mapped[float] = mapped_column(Float, default=0.0)
	qualification_status: Mapped[str] = mapped_column(String(32), default="unqualified")  # unqualified, qualified, hot
	
	# Metadata
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
	
	# Relationships
	lead: Mapped["Lead"] = relationship("Lead", back_populates="score")

class ScoringRule(Base):
	__tablename__ = "scoring_rules"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	name: Mapped[str] = mapped_column(String(255))
	field: Mapped[str] = mapped_column(String(64))  # company_size, industry, role, location
	condition: Mapped[str] = mapped_column(String(64))  # equals, contains, greater_than, less_than
	value: Mapped[str] = mapped_column(String(512))
	score: Mapped[float] = mapped_column(Float)
	is_active: Mapped[bool] = mapped_column(Boolean, default=True)
	
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class LeadQualification(Base):
	__tablename__ = "lead_qualifications"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), index=True)
	
	# Qualification criteria
	has_email: Mapped[bool] = mapped_column(Boolean, default=False)
	has_linkedin: Mapped[bool] = mapped_column(Boolean, default=False)
	has_company_info: Mapped[bool] = mapped_column(Boolean, default=False)
	has_role_info: Mapped[bool] = mapped_column(Boolean, default=False)
	
	# Engagement metrics
	email_opened: Mapped[bool] = mapped_column(Boolean, default=False)
	email_clicked: Mapped[bool] = mapped_column(Boolean, default=False)
	email_replied: Mapped[bool] = mapped_column(Boolean, default=False)
	
	# Qualification status
	is_qualified: Mapped[bool] = mapped_column(Boolean, default=False)
	qualification_reason: Mapped[str | None] = mapped_column(String(512))
	
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
	
	# Relationships
	lead: Mapped["Lead"] = relationship("Lead", back_populates="qualification")
