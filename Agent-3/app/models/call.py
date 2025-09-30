from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

class CallSession(Base):
	__tablename__ = "call_sessions"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	lead_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
	email: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
	phone: Mapped[str] = mapped_column(String(32))
	status: Mapped[str] = mapped_column(String(32), default="initiated")
	stage: Mapped[str | None] = mapped_column(String(64), nullable=True)
	disposition: Mapped[str | None] = mapped_column(String(64), nullable=True)
	offer: Mapped[str | None] = mapped_column(Text, nullable=True)
	purpose: Mapped[str | None] = mapped_column(String(32), nullable=True)  # e.g., "sales" or "job_application"
	context: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string for extra context
	twilio_call_sid: Mapped[str | None] = mapped_column(String(64), nullable=True)
	recording_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
	transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class CallNote(Base):
	__tablename__ = "call_notes"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	call_id: Mapped[int] = mapped_column(Integer, ForeignKey("call_sessions.id", ondelete="CASCADE"), index=True)
	content: Mapped[str] = mapped_column(Text)
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CallEvent(Base):
	__tablename__ = "call_events"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	call_id: Mapped[int] = mapped_column(Integer, ForeignKey("call_sessions.id", ondelete="CASCADE"), index=True)
	event_type: Mapped[str] = mapped_column(String(64))  # ringing, answered, completed, recording, transcription
	payload: Mapped[str | None] = mapped_column(Text, nullable=True)  # raw form or JSON string
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
