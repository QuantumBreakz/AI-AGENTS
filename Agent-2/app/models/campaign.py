from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

class Campaign(Base):
	__tablename__ = "campaigns"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	name: Mapped[str] = mapped_column(String(255), index=True)
	offer: Mapped[str | None] = mapped_column(Text)
	status: Mapped[str] = mapped_column(String(32), default="draft")
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

	emails: Mapped[list["CampaignEmail"]] = relationship(back_populates="campaign", cascade="all, delete-orphan")
	recipients: Mapped[list["CampaignRecipient"]] = relationship(back_populates="campaign", cascade="all, delete-orphan")

class CampaignEmail(Base):
	__tablename__ = "campaign_emails"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
	sequence_order: Mapped[int] = mapped_column(Integer, default=1)
	subject_template: Mapped[str | None] = mapped_column(String(255))
	body_template: Mapped[str | None] = mapped_column(Text)
	send_delay_hours: Mapped[int] = mapped_column(Integer, default=24)
	is_follow_up: Mapped[bool] = mapped_column(Boolean, default=False)

	campaign: Mapped[Campaign] = relationship(back_populates="emails")
	variants: Mapped[list["CampaignEmailVariant"]] = relationship(back_populates="email", cascade="all, delete-orphan")

class CampaignEmailVariant(Base):
	__tablename__ = "campaign_email_variants"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	email_id: Mapped[int] = mapped_column(ForeignKey("campaign_emails.id", ondelete="CASCADE"), index=True)
	label: Mapped[str] = mapped_column(String(32), default="A")
	subject_template: Mapped[str | None] = mapped_column(String(255))
	body_template: Mapped[str | None] = mapped_column(Text)
	weight: Mapped[int] = mapped_column(Integer, default=1)

	email: Mapped[CampaignEmail] = relationship(back_populates="variants")

class CampaignRecipient(Base):
	__tablename__ = "campaign_recipients"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
	lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), index=True)
	email: Mapped[str] = mapped_column(String(255), index=True)
	current_step: Mapped[int] = mapped_column(Integer, default=0)
	last_sent_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	next_send_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	paused: Mapped[bool] = mapped_column(Boolean, default=False)
	variant_label: Mapped[str | None] = mapped_column(String(32), nullable=True)

	campaign: Mapped[Campaign] = relationship(back_populates="recipients")
