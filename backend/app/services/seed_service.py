import json
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.case import Case, AnalystNote, CaseReviewAction
from app.models.evidence import Evidence
from app.models.detection import DetectionIndicator
from app.models.correlation import EvidenceRelationship
from app.models.audit import AuditEvent
from app.services.auth_service import hash_password
from app.engine.normalizer import normalize_text
from app.engine.extractors import extract_entities
from app.engine.rules import evaluate_rules
from app.engine.scorer import calculate_score_and_assessment
from app.engine.correlator import correlate_case_with_corpus

def seed_database(db: Session):
    """
    Seeds default administrative users, analysts, and realistic financial scam cases.
    """
    # 1. Seed Users if not present
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@scamshield.local",
            full_name="System Administrator",
            hashed_password=hash_password("Admin@ScamShield2026!"),
            role="admin",
            is_active=True
        )
        db.add(admin)

    analyst = db.query(User).filter(User.username == "analyst").first()
    if not analyst:
        analyst = User(
            username="analyst",
            email="analyst@scamshield.local",
            full_name="Senior Fraud Investigator",
            hashed_password=hash_password("Analyst@ScamShield2026!"),
            role="analyst",
            is_active=True
        )
        db.add(analyst)

    db.commit()

    # If cases already exist, skip case seeding
    if db.query(Case).count() > 0:
        return

    # 2. Seed Realistic Synthetic Cases
    sample_scenarios = [
        {
            "ref": "SCAM-2026-8812",
            "title": "Reverse UPI Collect Request Fraud (Failed PhonePe Refund)",
            "evidence_type": "payment_interaction",
            "text": "Sir your payment of Rs 4,999 failed on PhonePe. Click here to approve collect request and enter your UPI PIN to receive refund immediately into your account. Payee: refund.officer98@ybl.",
            "notes": "User was attempting to receive a refund for an e-commerce order when caller sent a collect request.",
            "status": "verified_scam"
        },
        {
            "ref": "SCAM-2026-9043",
            "title": "Urgent Electricity Disconnection Threat with Fake Helpline",
            "evidence_type": "sms",
            "text": "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM from the electricity office because your previous month bill was not updated. Please call our power officer immediately at 9876543210. Thank you.",
            "notes": "Received as an unsolicited SMS from an unknown personal mobile sender.",
            "status": "in_investigation"
        },
        {
            "ref": "SCAM-2026-7119",
            "title": "Remote Desktop Takeover Fraud via AnyDesk Solicitation",
            "evidence_type": "payment_interaction",
            "text": "Caller claimed to be SBI Customer Care helpline regarding uncredited cashback of Rs 12,500. Directed me to install AnyDesk app from play store and read out the 9-digit remote address code to enable fast refund sync.",
            "notes": "Caller had caller ID spoofed as 'SBI Support'. Wanted screen view.",
            "status": "in_investigation"
        },
        {
            "ref": "SCAM-2026-4402",
            "title": "Bank Account Suspension Pretext with Suspicious Shortlink",
            "evidence_type": "sms",
            "text": "Your HDFC bank account has been blocked due to incomplete PAN card KYC update. Kindly click http://bit.ly/hdfc-kyc-verify to update your KYC details within 24 hours to avoid permanent deactivation.",
            "notes": "SMS containing shortened bitly link directing to fake banking portal.",
            "status": "pending_review"
        },
        {
            "ref": "SCAM-2026-3021",
            "title": "Telegram Part-Time Task & Guaranteed Yield Scam",
            "evidence_type": "other",
            "text": "Congratulations! You are selected for part time job. Earn daily income Rs 3,500 by simply liking YouTube videos. Contact our telegram manager to receive Rs 500 joining bonus and start your daily investment task.",
            "notes": "Solicitation received via unsolicited messaging group.",
            "status": "pending_review"
        },
        {
            "ref": "SCAM-2026-1050",
            "title": "Legitimate Bank OTP Alert (Baseline Evaluation)",
            "evidence_type": "sms",
            "text": "Dear Customer, OTP for your online transaction of Rs 850 at BookMyShow on card ending 4012 is 492810. Do not share this OTP with anyone, including bank staff. If not done by you, please call 1800-425-3800.",
            "notes": "Legitimate transactional OTP received while purchasing movie tickets.",
            "status": "false_positive"
        },
        {
            "ref": "SCAM-2026-9921",
            "title": "Correlated UPI Collect Fraud (Matching Syndicate VPA)",
            "evidence_type": "payment_interaction",
            "text": "GPay support team: You won cashback of Rs 2,000. Accept collect request sent to your UPI app and enter MPIN to claim cash directly. Transfer sent from refund.officer98@ybl.",
            "notes": "Shares the exact same VPA as case SCAM-2026-8812.",
            "status": "in_investigation"
        }
    ]

    for item in sample_scenarios:
        normalized = normalize_text(item["text"])
        entities = extract_entities(normalized)
        rule_matches = evaluate_rules(normalized, entities)
        assessment = calculate_score_and_assessment(rule_matches, normalized, entities)

        case = Case(
            case_reference=item["ref"],
            title=item["title"],
            summary=assessment["summary"],
            status=item["status"],
            risk_category=assessment["risk_category"],
            risk_score=assessment["risk_score"],
            uncertainty_level=assessment["uncertainty_level"],
            primary_threat_type=assessment["primary_threat_type"],
            confidence_score=assessment["confidence_score"],
            reporter_notes=item["notes"],
            safe_recommendations=json.dumps(assessment["safe_recommendations"]),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(case)
        db.flush()

        evidence = Evidence(
            case_id=case.id,
            evidence_type=item["evidence_type"],
            raw_content=item["text"],
            normalized_content=normalized,
            extracted_entities=json.dumps(entities),
            source_metadata=json.dumps({"origin": "Synthetic Dataset", "channel": item["evidence_type"]}),
            created_at=datetime.now(timezone.utc),
        )
        db.add(evidence)

        for match in rule_matches:
            indicator = DetectionIndicator(
                case_id=case.id,
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
            db.add(indicator)

        # Seed initial analyst notes for reviewed cases
        if item["status"] in ["verified_scam", "in_investigation", "false_positive"]:
            note = AnalystNote(
                case_id=case.id,
                author_username="analyst",
                content=f"Initial triage performed. Case verified against known indicators. Threat profile matches {assessment['primary_threat_type']}.",
                created_at=datetime.now(timezone.utc),
            )
            db.add(note)

            review = CaseReviewAction(
                case_id=case.id,
                actor_username="analyst",
                previous_status="pending_review",
                new_status=item["status"],
                reason="Categorized based on clear technical indicators and extracted evidence.",
                created_at=datetime.now(timezone.utc),
            )
            db.add(review)

        # Correlate with existing cases
        relationships = correlate_case_with_corpus(db, case, entities)
        for rel in relationships:
            db.add(rel)

        db.commit()

    # Record initial audit entry
    audit = AuditEvent(
        action_type="DATABASE_SEEDED",
        actor_username="system",
        entity_type="system",
        details="Initial synthetic financial fraud cases and users seeded successfully.",
        created_at=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()
