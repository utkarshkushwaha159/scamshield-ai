import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.correlation import EvidenceRelationship

def correlate_case_with_corpus(db: Session, current_case: Case, current_entities: Dict[str, Any]) -> List[EvidenceRelationship]:
    """
    Identifies defensible links between the current case and existing cases in the database.
    Correlations require concrete anchors (UPI ID, Phone number, or Suspicious URL domain)
    or highly specific modus operandi signatures.
    """
    new_relationships: List[EvidenceRelationship] = []

    # Get all other cases
    other_cases = db.query(Case).filter(Case.id != current_case.id).all()
    if not other_cases:
        return []

    # Extract current case anchors
    cur_upis = set(current_entities.get("upi_ids", []))
    cur_phones = set(current_entities.get("phone_numbers", []))
    cur_domains = set(current_entities.get("domains", []))
    cur_threat = current_case.primary_threat_type

    for other in other_cases:
        # Check existing relationships between this pair to avoid duplicate edges
        existing = db.query(EvidenceRelationship).filter(
            ((EvidenceRelationship.source_case_id == current_case.id) & (EvidenceRelationship.target_case_id == other.id)) |
            ((EvidenceRelationship.source_case_id == other.id) & (EvidenceRelationship.target_case_id == current_case.id))
        ).first()
        if existing:
            continue

        # Inspect other case's evidences to extract anchors
        other_upis = set()
        other_phones = set()
        other_domains = set()

        for ev in other.evidences:
            if ev.extracted_entities:
                try:
                    ents = json.loads(ev.extracted_entities)
                    other_upis.update(ents.get("upi_ids", []))
                    other_phones.update(ents.get("phone_numbers", []))
                    other_domains.update(ents.get("domains", []))
                except Exception:
                    pass

        # 1. Concrete anchor: Shared UPI VPA
        shared_upis = cur_upis.intersection(other_upis)
        if shared_upis:
            anchor = list(shared_upis)[0]
            rel = EvidenceRelationship(
                source_case_id=current_case.id,
                target_case_id=other.id,
                relationship_type="shared_upi_vpa",
                evidence_anchor=anchor,
                is_inferred=False,
                justification=f"Both cases reference the exact same Virtual Payment Address (VPA): '{anchor}'. Indicates shared recipient account or syndicate operation."
            )
            new_relationships.append(rel)
            continue  # strongest anchor found for this pair

        # 2. Concrete anchor: Shared Phone Number
        shared_phones = cur_phones.intersection(other_phones)
        if shared_phones:
            anchor = list(shared_phones)[0]
            rel = EvidenceRelationship(
                source_case_id=current_case.id,
                target_case_id=other.id,
                relationship_type="shared_phone_number",
                evidence_anchor=anchor,
                is_inferred=False,
                justification=f"Both cases received communications from the exact same phone number: '{anchor}'. Direct contact indicator overlap."
            )
            new_relationships.append(rel)
            continue

        # 3. Concrete anchor: Shared Suspicious Domain
        shared_domains = cur_domains.intersection(other_domains)
        if shared_domains:
            anchor = list(shared_domains)[0]
            rel = EvidenceRelationship(
                source_case_id=current_case.id,
                target_case_id=other.id,
                relationship_type="shared_suspicious_url",
                evidence_anchor=anchor,
                is_inferred=False,
                justification=f"Both cases direct victims to the same destination host/domain: '{anchor}'. Shared phishing infrastructure."
            )
            new_relationships.append(rel)
            continue

        # 4. Modus Operandi correlation (only for high/critical specific scam patterns)
        high_specificity_threats = {
            "UPI Inverted Collect / PIN Deception",
            "Remote Desktop Takeover Fraud",
            "Utility Disconnection Pretext",
            "Banking KYC / Account Freeze Pretext"
        }
        if cur_threat in high_specificity_threats and cur_threat == other.primary_threat_type:
            # Check if both have critical/high severity indicators
            if current_case.risk_score >= 50.0 and other.risk_score >= 50.0:
                rel = EvidenceRelationship(
                    source_case_id=current_case.id,
                    target_case_id=other.id,
                    relationship_type="shared_modus_operandi",
                    evidence_anchor=cur_threat,
                    is_inferred=True,
                    justification=f"Cases exhibit an identical specialized financial fraud workflow ('{cur_threat}') with matching behavioral deception vectors."
                )
                new_relationships.append(rel)

    return new_relationships
