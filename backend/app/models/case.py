from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_reference = Column(String(32), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=True)
    status = Column(String(30), default="pending_review", index=True, nullable=False)
    # Permitted statuses:
    # 'pending_review', 'in_investigation', 'verified_scam', 'inconclusive', 'false_positive', 'closed_resolved'
    risk_category = Column(String(20), default="low", index=True, nullable=False)
    # 'low', 'medium', 'high', 'critical'
    risk_score = Column(Float, default=0.0, nullable=False)  # 0.0 to 100.0
    uncertainty_level = Column(String(20), default="moderate", nullable=False)  # 'low', 'moderate', 'high'
    primary_threat_type = Column(String(100), default="Unclassified Interaction", nullable=False)
    confidence_score = Column(Float, default=0.5, nullable=False)  # 0.0 to 1.0
    reporter_notes = Column(Text, nullable=True)
    safe_recommendations = Column(Text, nullable=True)  # JSON-encoded array of safe action strings
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    source_language = Column(String(20), default="en", nullable=False)
    language_confidence = Column(Float, default=1.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    owner = relationship("User", foreign_keys=[owner_id])


    # Relationships
    evidences = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    indicators = relationship("DetectionIndicator", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("AnalystNote", back_populates="case", cascade="all, delete-orphan", order_by="AnalystNote.created_at.desc()")
    review_actions = relationship("CaseReviewAction", back_populates="case", cascade="all, delete-orphan", order_by="CaseReviewAction.created_at.desc()")


class AnalystNote(Base):
    __tablename__ = "analyst_notes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    author_username = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("Case", back_populates="notes")


class CaseReviewAction(Base):
    __tablename__ = "case_review_actions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_username = Column(String(50), nullable=False)
    previous_status = Column(String(30), nullable=False)
    new_status = Column(String(30), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("Case", back_populates="review_actions")
