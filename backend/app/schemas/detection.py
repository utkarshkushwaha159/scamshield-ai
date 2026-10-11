from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

class DetectionIndicatorSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    rule_id: str
    rule_name: str
    category: str
    severity: str
    score_contribution: float
    explanation: str
    matched_value: Optional[str] = None
    confidence: float = 1.0
    created_at: Optional[datetime] = None

