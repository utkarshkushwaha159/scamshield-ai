from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, List
from datetime import datetime

class SystemStatsResponse(BaseModel):
    total_cases: int
    pending_cases: int
    investigating_cases: int
    verified_scams: int
    inconclusive_cases: int
    false_positives: int
    critical_risk_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    total_evidences: int
    total_indicators_flagged: int
    total_relationships: int
    threat_breakdown: Dict[str, int]

class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action_type: str
    actor_username: str
    entity_type: str
    entity_id: str | None
    details: str | None
    ip_address: str | None
    created_at: datetime


class RuleConfigItem(BaseModel):
    rule_id: str
    name: str
    category: str
    base_weight: float
    severity: str
    description: str
    enabled: bool = True
