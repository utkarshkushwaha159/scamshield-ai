from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from app.database import Base

class ThreatIntelFeed(Base):
    __tablename__ = "threat_intel_feeds"

    id = Column(Integer, primary_key=True, index=True)
    indicator_type = Column(String(50), index=True, nullable=False)  # "upi_vpa", "phone_number", "url_domain", "sender_header"
    indicator_value = Column(String(255), index=True, nullable=False)
    threat_actor_or_source = Column(String(100), default="CERT-In / NPCI Fraud Bulletin (Synthetic)", nullable=False)
    severity = Column(String(20), default="high", nullable=False)  # "critical", "high", "medium"
    description = Column(Text, nullable=False)
    confidence = Column(Float, default=0.95, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
