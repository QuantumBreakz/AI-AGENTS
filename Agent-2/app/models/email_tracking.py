from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class EmailMessageLog(Base):
	__tablename__ = "email_message_logs"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	recipient_id: Mapped[int | None] = mapped_column(ForeignKey("campaign_recipients.id", ondelete="SET NULL"), index=True, nullable=True)
	lead_id: Mapped[int | None] = mapped_column(ForeignKey("leads.id", ondelete="SET NULL"), index=True, nullable=True)
	provider: Mapped[str | None] = mapped_column(String(64), nullable=True)
	provider_message_id: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
	status: Mapped[str] = mapped_column(String(32), default="sent")  # sent, delivered, opened, clicked, bounced, complained, replied, failed
	error: Mapped[str | None] = mapped_column(Text, nullable=True)
	metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

	subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
	body_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

	sent_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	delivered_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	opened_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	clicked_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	replied_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	bounced_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	complained_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)

	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

	# Relationships
	recipient: Mapped["CampaignRecipient" | None] = relationship("CampaignRecipient")


class CampaignRecipientEvent(Base):
	__tablename__ = "campaign_recipient_events"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	recipient_id: Mapped[int] = mapped_column(ForeignKey("campaign_recipients.id", ondelete="CASCADE"), index=True)
	event_type: Mapped[str] = mapped_column(String(64))  # sent, delivered, opened, clicked, bounced, complained, replied, paused, resumed
	payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


