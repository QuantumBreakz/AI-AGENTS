from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

class Appointment(Base):
	__tablename__ = "appointments"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	call_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("call_sessions.id", ondelete="SET NULL"), index=True, nullable=True)
	email: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
	start_time: Mapped[DateTime] = mapped_column(DateTime(timezone=True))
	end_time: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	title: Mapped[str | None] = mapped_column(String(255), nullable=True)
	description: Mapped[str | None] = mapped_column(Text, nullable=True)
	calendar_event_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
