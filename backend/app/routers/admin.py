from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.detection import DetectionIndicator
from app.models.correlation import EvidenceRelationship
from app.models.audit import AuditEvent
from app.models.user import User
from app.schemas.admin import SystemStatsResponse, AuditEventResponse, RuleConfigItem
from app.schemas.auth import UserCreate, UserResponse
from app.services.auth_service import require_admin, require_analyst, hash_password

router = APIRouter(prefix="/api/admin", tags=["Administration & Telemetry"])

@router.get("/stats", response_model=SystemStatsResponse)
def get_system_stats(
    current_analyst: User = Depends(require_analyst),
    db: Session = Depends(get_db)
):
    """
    Computes real database-backed operational metrics for analysts and administrators.
    """
    total_cases = db.query(Case).count()
    pending = db.query(Case).filter(Case.status == "pending_review").count()
    investigating = db.query(Case).filter(Case.status == "in_investigation").count()
    verified = db.query(Case).filter(Case.status == "verified_scam").count()
    inconclusive = db.query(Case).filter(Case.status == "inconclusive").count()
    false_positives = db.query(Case).filter(Case.status == "false_positive").count()

    critical_count = db.query(Case).filter(Case.risk_category == "critical").count()
    high_count = db.query(Case).filter(Case.risk_category == "high").count()
    med_count = db.query(Case).filter(Case.risk_category == "medium").count()
    low_count = db.query(Case).filter(Case.risk_category == "low").count()

    total_evidences = db.query(Evidence).count()
    total_indicators = db.query(DetectionIndicator).count()
    total_relationships = db.query(EvidenceRelationship).count()

    # Threat breakdown
    threat_counts = db.query(
        Case.primary_threat_type, func.count(Case.id)
    ).group_by(Case.primary_threat_type).all()
    threat_breakdown = {threat: count for threat, count in threat_counts}

    return SystemStatsResponse(
        total_cases=total_cases,
        pending_cases=pending,
        investigating_cases=investigating,
        verified_scams=verified,
        inconclusive_cases=inconclusive,
        false_positives=false_positives,
        critical_risk_count=critical_count,
        high_risk_count=high_count,
        medium_risk_count=med_count,
        low_risk_count=low_count,
        total_evidences=total_evidences,
        total_indicators_flagged=total_indicators,
        total_relationships=total_relationships,
        threat_breakdown=threat_breakdown,
    )

@router.get("/audit-logs", response_model=List[AuditEventResponse])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_analyst: User = Depends(require_analyst),
    db: Session = Depends(get_db)
):
    """Returns recent system audit events."""
    events = db.query(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit).all()
    return events

@router.get("/rules", response_model=List[RuleConfigItem])
def list_detection_rules(current_analyst: User = Depends(require_analyst)):
    """Returns the registry of active explainable detection rules."""
    rules = [
        RuleConfigItem(
            rule_id="RULE_OTP_PIN_DEMAND",
            name="Demands for Secret Security Credentials (OTP/PIN/CVV)",
            category="credential_theft",
            base_weight=35.0,
            severity="critical",
            description="Detects explicit demands to share, read, or forward one-time passwords, MPINs, or payment card codes.",
            enabled=True
        ),
        RuleConfigItem(
            rule_id="RULE_UPI_COLLECT_REVERSE_FLOW",
            name="Inverted UPI Payment Flow (PIN to Receive)",
            category="payment_manipulation",
            base_weight=35.0,
            severity="critical",
            description="Detects deception instructing users to enter an MPIN or approve a collect request to claim refunds or rewards.",
            enabled=True
        ),
        RuleConfigItem(
            rule_id="RULE_REMOTE_ACCESS_APP",
            name="Remote Desktop / Screen-Sharing Application",
            category="device_takeover",
            base_weight=30.0,
            severity="critical",
            description="Identifies requests to install remote access utilities (AnyDesk, TeamViewer, QuickSupport) under support pretexts.",
            enabled=True
        ),
        RuleConfigItem(
            rule_id="RULE_ELECTRICITY_BILL_THREAT",
            name="Coercive Utility Disconnection Pretext",
            category="social_engineering",
            base_weight=25.0,
            severity="high",
            description="Flags threats of imminent electricity disconnection directing victims to unverified personal mobile numbers.",
            enabled=True
        ),
        RuleConfigItem(
            rule_id="RULE_KYC_ACCOUNT_SUSPENSION",
            name="Bank KYC / Account Suspension Pretext",
            category="impersonation",
            base_weight=25.0,
            severity="high",
            description="Detects fake urgent alerts demanding PAN card or KYC verification via external hyperlinks.",
            enabled=True
        ),
        RuleConfigItem(
            rule_id="RULE_UNVERIFIED_APK_DOWNLOAD",
            name="Unverified Android Package (APK) Installation",
            category="malware_distribution",
            base_weight=25.0,
            severity="high",
            description="Flags direct instructions to install unverified APK files outside of official app stores.",
            enabled=True
        ),
        RuleConfigItem(
            rule_id="RULE_SUSPICIOUS_URL_SHORTENER_OR_IP",
            name="Suspicious Link Infrastructure",
            category="suspicious_infrastructure",
            base_weight=18.0,
            severity="medium",
            description="Identifies URL shorteners, raw IP hosts, or high-risk top level domains.",
            enabled=True
        ),
        RuleConfigItem(
            rule_id="RULE_FAKE_CUSTOMER_CARE_IMPERSONATION",
            name="Unofficial Support Helpline Impersonation",
            category="impersonation",
            base_weight=22.0,
            severity="high",
            description="Detects customer support claims paired with unofficial personal 10-digit mobile contacts.",
            enabled=True
        ),
        RuleConfigItem(
            rule_id="RULE_LOTTERY_JOB_PART_TIME_TASK",
            name="Deceptive High-Yield Task / Part-Time Job",
            category="financial_fraud",
            base_weight=20.0,
            severity="medium",
            description="Flags part-time YouTube/Telegram task schemes promising unrealistic guaranteed daily yields.",
            enabled=True
        ),
        RuleConfigItem(
            rule_id="RULE_TIME_URGENCY_COERCION",
            name="Manufactured Time Urgency & Coercion",
            category="social_engineering",
            base_weight=12.0,
            severity="low",
            description="Detects aggressive artificial deadlines designed to rush victims past verification checks.",
            enabled=True
        ),
    ]
    return rules

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_authorized_user(
    payload: UserCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Creates a new authorized analyst or administrator. Requires administrator privileges."""
    existing = db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="User with this username or email already exists."
        )

    new_user = User(
        username=payload.username.strip(),
        email=payload.email.strip(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
