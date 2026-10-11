from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
from app.schemas.detection import DetectionIndicatorSchema

class EvidenceSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    evidence_type: str
    raw_content: str
    normalized_content: str
    extracted_entities: Optional[Any] = None
    source_metadata: Optional[Any] = None
    created_at: datetime

class AnalystNoteCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class AnalystNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    author_id: Optional[int] = None
    author_username: str
    content: str
    created_at: datetime

class StatusUpdateRequest(BaseModel):
    new_status: str = Field(..., description="Target status: pending_review, in_investigation, verified_scam, inconclusive, false_positive, closed_resolved")
    reason: str = Field(..., min_length=3, max_length=1000, description="Mandatory rationale for status change")

class CaseReviewActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    actor_id: Optional[int] = None
    actor_username: str
    previous_status: str
    new_status: str
    reason: str
    created_at: datetime

class CaseSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_reference: str
    title: str
    status: str
    risk_category: str
    risk_score: float
    uncertainty_level: str
    primary_threat_type: str
    indicator_count: int
    evidence_count: int
    created_at: datetime
    updated_at: datetime

class CaseDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_reference: str
    title: str
    summary: Optional[str] = None
    status: str
    risk_category: str
    risk_score: float
    uncertainty_level: str
    primary_threat_type: str
    confidence_score: float
    reporter_notes: Optional[str] = None
    safe_recommendations: List[str]
    created_at: datetime
    updated_at: datetime
    evidences: List[EvidenceSchema]
    indicators: List[DetectionIndicatorSchema]
    notes: List[AnalystNoteResponse]
    review_actions: List[CaseReviewActionResponse]
