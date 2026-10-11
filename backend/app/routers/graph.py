from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case
from app.models.correlation import EvidenceRelationship
from app.schemas.graph import GraphNode, GraphEdge, GraphResponse

router = APIRouter(prefix="/api/graph", tags=["Evidence Graph"])

@router.get("", response_model=GraphResponse)
def get_full_graph(
    case_id: Optional[int] = Query(None, description="Optional focus case ID for localized graph view"),
    db: Session = Depends(get_db)
):
    """
    Constructs an evidence correlation graph of cases, shared anchors (UPI, phone, URL),
    and relationships. If case_id is specified, returns the component connected to that case.
    """
    # Fetch relationships
    rel_query = db.query(EvidenceRelationship)
    if case_id:
        rel_query = rel_query.filter(
            (EvidenceRelationship.source_case_id == case_id) |
            (EvidenceRelationship.target_case_id == case_id)
        )
    relationships = rel_query.all()

    # Collect connected case IDs
    connected_case_ids = set()
    for rel in relationships:
        connected_case_ids.add(rel.source_case_id)
        connected_case_ids.add(rel.target_case_id)

    if case_id:
        connected_case_ids.add(case_id)

    # Fetch relevant cases
    cases_query = db.query(Case)
    if case_id or connected_case_ids:
        cases_query = cases_query.filter(Case.id.in_(connected_case_ids))
    cases = cases_query.all()

    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []
    anchor_nodes_created = set()

    for c in cases:
        nodes.append(GraphNode(
            id=f"case_{c.id}",
            label=c.case_reference,
            type="case",
            risk_category=c.risk_category,
            properties={
                "case_id": c.id,
                "title": c.title,
                "status": c.status,
                "risk_score": c.risk_score,
                "primary_threat_type": c.primary_threat_type
            }
        ))

    for rel in relationships:
        anchor_id = f"anchor_{rel.relationship_type}_{rel.evidence_anchor}"
        # Create an anchor entity node in the graph for clearer visual representation
        if anchor_id not in anchor_nodes_created:
            anchor_type = "upi" if "upi" in rel.relationship_type else (
                "phone" if "phone" in rel.relationship_type else (
                    "url" if "url" in rel.relationship_type else "modus_operandi"
                )
            )
            nodes.append(GraphNode(
                id=anchor_id,
                label=rel.evidence_anchor,
                type=anchor_type,
                risk_category="high" if not rel.is_inferred else "medium",
                properties={
                    "anchor_value": rel.evidence_anchor,
                    "relationship_type": rel.relationship_type,
                    "is_inferred": rel.is_inferred
                }
            ))
            anchor_nodes_created.add(anchor_id)

        # Edge from source case to anchor
        edges.append(GraphEdge(
            id=f"edge_{rel.id}_src",
            source=f"case_{rel.source_case_id}",
            target=anchor_id,
            label=rel.relationship_type.replace("_", " "),
            relationship_type=rel.relationship_type,
            is_inferred=rel.is_inferred,
            justification=rel.justification
        ))

        # Edge from anchor to target case
        edges.append(GraphEdge(
            id=f"edge_{rel.id}_tgt",
            source=anchor_id,
            target=f"case_{rel.target_case_id}",
            label=rel.relationship_type.replace("_", " "),
            relationship_type=rel.relationship_type,
            is_inferred=rel.is_inferred,
            justification=rel.justification
        ))

    return GraphResponse(
        nodes=nodes,
        edges=edges,
        total_connected_cases=len(cases)
    )
