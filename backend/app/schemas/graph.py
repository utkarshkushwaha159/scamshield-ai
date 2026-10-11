from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "case", "upi", "phone", "url", "modus_operandi"
    risk_category: Optional[str] = None
    properties: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    relationship_type: str
    is_inferred: bool = False
    justification: str

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_connected_cases: int
