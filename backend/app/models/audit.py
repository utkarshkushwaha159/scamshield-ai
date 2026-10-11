from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(50), nullable=False, index=True)  # e.g., "CASE_CREATED", "STATUS_UPDATED", "NOTE_ADDED", "USER_LOGIN"
    actor_username = Column(String(50), default="system", nullable=False)
    entity_type = Column(String(50), nullable=False)  # "case", "user", "evidence", "system"
    entity_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)  # JSON or text description
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
