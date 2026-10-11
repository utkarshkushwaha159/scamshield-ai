from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class EvidenceRelationship(Base):
    __tablename__ = "evidence_relationships"

    id = Column(Integer, primary_key=True, index=True)
    source_case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    target_case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False)  # "shared_upi_vpa", "shared_phone_number", "shared_suspicious_url", "shared_modus_operandi"
    evidence_anchor = Column(String(200), nullable=False)   # e.g., "refund.support@ybl", "+919876543210"
    is_inferred = Column(Boolean, default=False, nullable=False)  # False = observed exact match, True = inferred pattern
    justification = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    source_case = relationship("Case", foreign_keys=[source_case_id])
    target_case = relationship("Case", foreign_keys=[target_case_id])
