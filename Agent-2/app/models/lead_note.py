from sqlalchemy import Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

class LeadNote(Base):
	__tablename__ = "lead_notes"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	lead_id: Mapped[int] = mapped_column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), index=True)
	content: Mapped[str] = mapped_column(Text)
	created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
