from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from app.schemas.detection import DetectionIndicatorSchema

class EvidenceItemInput(BaseModel):
    evidence_type: str = Field(..., description="'sms', 'email', 'url', 'payment_interaction', or 'other'")
    content: str = Field(..., min_length=2, max_length=10000, description="Raw text, message, or URL")
    sender_or_source: Optional[str] = Field(None, max_length=200, description="Optional sender name, number, or origin")
    metadata: Optional[Dict[str, Any]] = None

class SubmissionRequest(BaseModel):
    evidence_items: List[EvidenceItemInput] = Field(..., min_length=1, description="List of evidence records")
    user_notes: Optional[str] = Field(None, max_length=2000, description="Contextual user notes")

class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_reference: str
    case_id: int
    title: str
    summary: str
    risk_category: str
    risk_score: float
    uncertainty_level: str
    primary_threat_type: str
    confidence_score: float
    indicators: List[DetectionIndicatorSchema]
    safe_recommendations: List[str]
    created_at: datetime

