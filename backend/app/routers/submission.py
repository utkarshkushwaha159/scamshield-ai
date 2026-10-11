import json
import uuid
import random
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.detection import DetectionIndicator
from app.models.audit import AuditEvent
from app.schemas.submission import SubmissionRequest, SubmissionResponse
from app.engine.normalizer import normalize_text
from app.engine.extractors import extract_entities
from app.engine.rules import evaluate_rules
from app.engine.scorer import calculate_score_and_assessment
from app.engine.correlator import correlate_case_with_corpus

router = APIRouter(prefix="/api/submit", tags=["Evidence Submission"])

def generate_case_reference() -> str:
    """Generates a memorable and collision-resistant case reference (e.g., SCAM-2026-9482)."""
    rand_suffix = random.randint(1000, 9999)
    year = datetime.now().year
    return f"SCAM-{year}-{rand_suffix}"

@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_evidence(payload: SubmissionRequest, db: Session = Depends(get_db)):
    """
    Submits suspicious evidence records, extracts indicators, evaluates explainable detection rules,
    persists a case, correlates with existing cases, and returns immediate risk analysis.
    """
    if not payload.evidence_items:
        raise HTTPException(status_code=400, detail="At least one evidence item must be submitted.")

    # Combine all evidence texts for aggregate analysis
    all_raw_text = "\n\n".join([item.content for item in payload.evidence_items])
    combined_normalized = normalize_text(all_raw_text)

    # Aggregate extracted entities
    combined_entities = extract_entities(combined_normalized)

    # Evaluate transparent detection rules
    rule_matches = evaluate_rules(combined_normalized, combined_entities)

    # Calculate score, uncertainty, and recommendations
    assessment = calculate_score_and_assessment(rule_matches, combined_normalized, combined_entities)

    # Generate a unique case reference
    case_ref = generate_case_reference()
    while db.query(Case).filter(Case.case_reference == case_ref).first() is not None:
        case_ref = generate_case_reference()

    # Determine concise descriptive title
    evidence_types = {e.evidence_type for e in payload.evidence_items}
    type_str = "/".join(sorted(list(evidence_types))).upper()
    threat_title = assessment["primary_threat_type"]
    case_title = f"{threat_title} ({type_str})"

    # Create and persist Case
    new_case = Case(
        case_reference=case_ref,
        title=case_title,
        summary=assessment["summary"],
        status="pending_review",
        risk_category=assessment["risk_category"],
        risk_score=assessment["risk_score"],
        uncertainty_level=assessment["uncertainty_level"],
        primary_threat_type=assessment["primary_threat_type"],
        confidence_score=assessment["confidence_score"],
        reporter_notes=payload.user_notes,
        safe_recommendations=json.dumps(assessment["safe_recommendations"]),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_case)
    db.flush()

    # Create and persist Evidence records
    for item in payload.evidence_items:
        norm_item = normalize_text(item.content)
        item_ents = extract_entities(norm_item)
        ev_meta = item.metadata or {}
        if item.sender_or_source:
            ev_meta["sender_or_source"] = item.sender_or_source

        evidence = Evidence(
            case_id=new_case.id,
            evidence_type=item.evidence_type,
            raw_content=item.content,
            normalized_content=norm_item,
            extracted_entities=json.dumps(item_ents),
            source_metadata=json.dumps(ev_meta),
            created_at=datetime.now(timezone.utc),
        )
        db.add(evidence)

    # Create and persist Detection Indicators
    for match in rule_matches:
        ind = DetectionIndicator(
            case_id=new_case.id,
            rule_id=match.rule_id,
            rule_name=match.name,
            category=match.category,
            severity=match.severity,
            score_contribution=match.score_contribution,
            explanation=match.explanation,
            matched_value=match.matched_value,
            confidence=match.confidence,
            created_at=datetime.now(timezone.utc),
        )
        db.add(ind)

    # Perform evidence correlation
    correlations = correlate_case_with_corpus(db, new_case, combined_entities)
    for rel in correlations:
        db.add(rel)

    # Record audit event
    audit = AuditEvent(
        action_type="CASE_SUBMITTED",
        actor_username="voluntary_submitter",
        entity_type="case",
        entity_id=case_ref,
        details=f"Case submitted with {len(payload.evidence_items)} items. Risk Score: {assessment['risk_score']} ({assessment['risk_category']}).",
        created_at=datetime.now(timezone.utc),
    )
    db.add(audit)
    db.commit()
    db.refresh(new_case)

    return SubmissionResponse(
        case_reference=new_case.case_reference,
        case_id=new_case.id,
        title=new_case.title,
        summary=new_case.summary,
        risk_category=new_case.risk_category,
        risk_score=new_case.risk_score,
        uncertainty_level=new_case.uncertainty_level,
        primary_threat_type=new_case.primary_threat_type,
        confidence_score=new_case.confidence_score,
        indicators=[m.to_dict() for m in rule_matches],
        safe_recommendations=assessment["safe_recommendations"],
        created_at=new_case.created_at,
    )
