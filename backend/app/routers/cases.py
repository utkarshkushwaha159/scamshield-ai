import json
from typing import List, Optional, Dict
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
from app.services.auth_service import require_analyst, get_current_user_optional, get_current_user
from app.services.translation_service import translate_evidence_text

router = APIRouter(prefix="/api/cases", tags=["Case Management"])

PERMITTED_STATUSES = {
    "pending_review",
    "in_investigation",
    "verified_scam",
    "inconclusive",
    "false_positive",
    "closed_resolved",
}

def parse_case_detail(case: Case, db: Session) -> CaseDetail:
    """Helper to convert Case model into validated CaseDetail schema with parsed JSON fields and translations."""
    safe_recs = []
    if case.safe_recommendations:
        try:
            safe_recs = json.loads(case.safe_recommendations)
        except Exception:
            safe_recs = [case.safe_recommendations]

    parsed_evidences = []
    all_raw_text_parts = []
    for ev in case.evidences:
        all_raw_text_parts.append(ev.raw_content)
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

    combined_text = "\n\n".join(all_raw_text_parts)
    translations: Dict[str, str] = {}
    src_lang = case.source_language or "en"
    translations["en"] = translate_evidence_text(db, combined_text, src_lang, "en")
    translations["hi"] = translate_evidence_text(db, combined_text, src_lang, "hi")
    translations["bn"] = translate_evidence_text(db, combined_text, src_lang, "bn")

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
        source_language=src_lang,
        language_confidence=case.language_confidence or 1.0,
        translations=translations,
        owner_id=case.owner_id,
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
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Lists submitted cases with role-aware privacy scopes:
    - Standard USER sees only their own submitted cases.
    - ANALYST and ADMIN see all cases across the platform.
    """
    query = db.query(Case)

    if current_user and current_user.role.upper() == "USER":
        query = query.filter(Case.owner_id == current_user.id)

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
            source_language=c.source_language or "en",
            owner_id=c.owner_id,
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
    return parse_case_detail(case, db)

@router.get("/{case_id}", response_model=CaseDetail)
def get_case_by_id(
    case_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Retrieves full details of a case by its internal database ID with case ownership enforcement.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case ID {case_id} not found.")

    if current_user and current_user.role.upper() == "USER" and case.owner_id is not None:
        if case.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: You do not have permission to view this case.")

    return parse_case_detail(case, db)

@router.delete("/{case_id}", status_code=status.HTTP_200_OK)
def delete_case(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a case under privacy-by-design user data deletion rights.
    Users can delete their own cases; Administrators can delete any case.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    is_owner = (case.owner_id == current_user.id)
    is_admin = (current_user.role.upper() == "ADMIN")

    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Permission denied: You can only delete your own submitted cases.")

    case_ref = case.case_reference
    db.delete(case)

    audit = AuditEvent(
        action_type="CASE_DELETED",
        actor_username=current_user.username,
        entity_type="case",
        entity_id=case_ref,
        details=f"Case {case_ref} permanently purged per user privacy request.",
        created_at=datetime.now(timezone.utc),
    )
    db.add(audit)
    db.commit()

    return {"message": f"Case {case_ref} successfully deleted and permanently purged."}

@router.patch("/{case_id}/language", response_model=CaseDetail)
def update_case_language(
    case_id: int,
    language: str = Query(..., description="Target language code: en, hi, hinglish, bn, ta, te"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows manual source language correction on a case.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    case.source_language = language.lower()
    case.language_confidence = 1.0
    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(case)

    return parse_case_detail(case, db)

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
    Transitions case status with mandatory rationale. Requires authenticated analyst role.
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

    return parse_case_detail(case, db)
