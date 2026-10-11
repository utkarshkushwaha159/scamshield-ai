from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class DetectionIndicator(Base):
    __tablename__ = "detection_indicators"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(String(50), nullable=False, index=True)
    rule_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)  # e.g., "credential_theft", "coercion", "impersonation", "unusual_payment"
    severity = Column(String(20), nullable=False)  # "low", "medium", "high", "critical"
    score_contribution = Column(Float, nullable=False)
    explanation = Column(Text, nullable=False)
    matched_value = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("Case", back_populates="indicators")
