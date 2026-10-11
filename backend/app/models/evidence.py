from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_type = Column(String(50), nullable=False)  # "sms", "email", "url", "payment_interaction", "other"
    raw_content = Column(Text, nullable=False)
    normalized_content = Column(Text, nullable=False)
    extracted_entities = Column(Text, nullable=True)  # JSON-encoded extracted indicators (UPIS, URLs, phones, etc.)
    source_metadata = Column(Text, nullable=True)  # JSON-encoded metadata (sender, timestamp, platform, etc.)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("Case", back_populates="evidences")
