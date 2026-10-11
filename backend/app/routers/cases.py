import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.case import Case, AnalystNote, CaseReviewAction
from app.models.evidence import Evidence
from app.models.user import User
from app.models.audit import AuditEvent
from app.schemas.case import (
    CaseSummary,
    CaseDetail,
    StatusUpdateRequest,
    AnalystNoteCreate,
    AnalystNoteResponse,
    CaseReviewActionResponse,
    EvidenceSchema
)
from app.schemas.detection import DetectionIndicatorSchema
from app.services.auth_service import require_analyst, get_current_user

router = APIRouter(prefix="/api/cases", tags=["Case Management"])

PERMITTED_STATUSES = {
    "pending_review",
    "in_investigation",
    "verified_scam",
    "inconclusive",
    "false_positive",
    "closed_resolved",
}

def parse_case_detail(case: Case) -> CaseDetail:
    """Helper to convert Case model into validated CaseDetail schema with parsed JSON fields."""
    safe_recs = []
    if case.safe_recommendations:
        try:
            safe_recs = json.loads(case.safe_recommendations)
        except Exception:
            safe_recs = [case.safe_recommendations]

    parsed_evidences = []
    for ev in case.evidences:
        extracted = None
        metadata = None
        if ev.extracted_entities:
            try:
                extracted = json.loads(ev.extracted_entities)
            except Exception:
                extracted = ev.extracted_entities
        if ev.source_metadata:
            try:
                metadata = json.loads(ev.source_metadata)
            except Exception:
                metadata = ev.source_metadata
        parsed_evidences.append(EvidenceSchema(
            id=ev.id,
            case_id=ev.case_id,
            evidence_type=ev.evidence_type,
            raw_content=ev.raw_content,
            normalized_content=ev.normalized_content,
            extracted_entities=extracted,
            source_metadata=metadata,
            created_at=ev.created_at,
        ))

    parsed_indicators = [
        DetectionIndicatorSchema.model_validate(ind) for ind in case.indicators
    ]
    parsed_notes = [
        AnalystNoteResponse.model_validate(n) for n in case.notes
    ]
    parsed_reviews = [
        CaseReviewActionResponse.model_validate(r) for r in case.review_actions
    ]

    return CaseDetail(
        id=case.id,
        case_reference=case.case_reference,
        title=case.title,
        summary=case.summary,
        status=case.status,
        risk_category=case.risk_category,
        risk_score=case.risk_score,
        uncertainty_level=case.uncertainty_level,
        primary_threat_type=case.primary_threat_type,
        confidence_score=case.confidence_score,
        reporter_notes=case.reporter_notes,
        safe_recommendations=safe_recs,
        created_at=case.created_at,
        updated_at=case.updated_at,
        evidences=parsed_evidences,
        indicators=parsed_indicators,
        notes=parsed_notes,
        review_actions=parsed_reviews,
    )

@router.get("", response_model=List[CaseSummary])
def list_cases(
    status_filter: Optional[str] = Query(None, alias="status"),
    risk_filter: Optional[str] = Query(None, alias="risk"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Lists submitted cases with filtering by status, risk category, or search term.
    """
    query = db.query(Case)

    if status_filter:
        query = query.filter(Case.status == status_filter)
    if risk_filter:
        query = query.filter(Case.risk_category == risk_filter)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Case.case_reference.ilike(search_pattern),
                Case.title.ilike(search_pattern),
                Case.primary_threat_type.ilike(search_pattern)
            )
        )

    cases = query.order_by(Case.created_at.desc()).offset(offset).limit(limit).all()

    results = []
    for c in cases:
        results.append(CaseSummary(
            id=c.id,
            case_reference=c.case_reference,
            title=c.title,
            status=c.status,
            risk_category=c.risk_category,
            risk_score=c.risk_score,
            uncertainty_level=c.uncertainty_level,
            primary_threat_type=c.primary_threat_type,
            indicator_count=len(c.indicators),
            evidence_count=len(c.evidences),
            created_at=c.created_at,
            updated_at=c.updated_at,
        ))
    return results

@router.get("/ref/{case_ref}", response_model=CaseDetail)
def get_case_by_reference(case_ref: str, db: Session = Depends(get_db)):
    """
    Retrieves full details of a case by its unique human-readable case reference (e.g. SCAM-2026-8812).
    """
    case = db.query(Case).filter(Case.case_reference == case_ref.strip()).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case with reference '{case_ref}' not found.")
    return parse_case_detail(case)

@router.get("/{case_id}", response_model=CaseDetail)
def get_case_by_id(case_id: int, db: Session = Depends(get_db)):
    """
    Retrieves full details of a case by its internal database ID.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case ID {case_id} not found.")
    return parse_case_detail(case)

@router.post("/{case_id}/notes", response_model=AnalystNoteResponse)
def add_analyst_note(
    case_id: int,
    payload: AnalystNoteCreate,
    current_analyst: User = Depends(require_analyst),
    db: Session = Depends(get_db)
):
    """
    Adds an analyst finding/note to the case. Requires authenticated analyst role.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    note = AnalystNote(
        case_id=case.id,
        author_id=current_analyst.id,
        author_username=current_analyst.username,
        content=payload.content.strip(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(note)

    # Log audit event
    audit = AuditEvent(
        action_type="NOTE_ADDED",
        actor_username=current_analyst.username,
        entity_type="case",
        entity_id=case.case_reference,
        details=f"Analyst {current_analyst.username} added an investigation note.",
        created_at=datetime.now(timezone.utc),
    )
    db.add(audit)
    db.commit()
    db.refresh(note)

    return note

@router.patch("/{case_id}/status", response_model=CaseDetail)
def update_case_status(
    case_id: int,
    payload: StatusUpdateRequest,
    current_analyst: User = Depends(require_analyst),
    db: Session = Depends(get_db)
):
    """
    Transitions case status with a mandatory rationale. Requires authenticated analyst role.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    new_stat = payload.new_status.strip().lower()
    if new_stat not in PERMITTED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{payload.new_status}'. Permitted: {', '.join(sorted(PERMITTED_STATUSES))}"
        )

    prev_status = case.status
    case.status = new_stat
    case.updated_at = datetime.now(timezone.utc)

    # Record review action
    review = CaseReviewAction(
        case_id=case.id,
        actor_id=current_analyst.id,
        actor_username=current_analyst.username,
        previous_status=prev_status,
        new_status=new_stat,
        reason=payload.reason.strip(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(review)

    # Log audit event
    audit = AuditEvent(
        action_type="STATUS_UPDATED",
        actor_username=current_analyst.username,
        entity_type="case",
        entity_id=case.case_reference,
        details=f"Status transitioned from {prev_status} to {new_stat}. Rationale: {payload.reason}",
        created_at=datetime.now(timezone.utc),
    )
    db.add(audit)
    db.commit()
    db.refresh(case)

    return parse_case_detail(case)
