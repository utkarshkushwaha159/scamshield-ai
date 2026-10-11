from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.threat_intel import ThreatIntelFeed

# Synthetic threat intelligence corpus based on documented Indian cyber police bulletins
SYNTHETIC_INTEL_RECORDS = [
    {
        "indicator_type": "upi_vpa",
        "indicator_value": "refund.officer98@ybl",
        "threat_actor_or_source": "National Cyber Crime Reporting Portal (1930 Bulletin)",
        "severity": "critical",
        "description": "Known fraudulent collect-request beneficiary VPA flagged across multiple e-commerce refund scam complaints.",
        "confidence": 0.98
    },
    {
        "indicator_type": "upi_vpa",
        "indicator_value": "refund.agent42@ybl",
        "threat_actor_or_source": "State Cyber Cell Advisory (Synthetic)",
        "severity": "critical",
        "description": "Reported mule account executing unauthorized reverse-collect payment requests.",
        "confidence": 0.95
    },
    {
        "indicator_type": "phone_number",
        "indicator_value": "+919876543210",
        "threat_actor_or_source": "Discom Anti-Fraud Intelligence (Synthetic)",
        "severity": "high",
        "description": "Personal mobile number frequently used in coercive evening electricity disconnection SMS pretexts.",
        "confidence": 0.92
    },
    {
        "indicator_type": "url_domain",
        "indicator_value": "bit.ly/hdfc-kyc-verify",
        "threat_actor_or_source": "PhishTank / CERT-In Threat Feed",
        "severity": "critical",
        "description": "Obfuscated banking phishing landing page capturing netbanking credentials.",
        "confidence": 0.96
    }
]

def seed_threat_intel_feeds(db: Session):
    """Initializes the threat intelligence blocklist database if empty."""
    if db.query(ThreatIntelFeed).count() == 0:
        for rec in SYNTHETIC_INTEL_RECORDS:
            feed_item = ThreatIntelFeed(**rec)
            db.add(feed_item)
        db.commit()

def query_threat_intel(db: Session, entities: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Queries the threat intelligence feed for any matches against extracted indicators.
    Returns list of matched intel items.
    """
    matches = []

    # 1. Check UPI VPAs
    for vpa in entities.get("upi_ids", []):
        record = db.query(ThreatIntelFeed).filter(
            ThreatIntelFeed.indicator_type == "upi_vpa",
            ThreatIntelFeed.indicator_value == vpa.lower()
        ).first()
        if record:
            matches.append({
                "type": "upi_vpa",
                "value": vpa,
                "source": record.threat_actor_or_source,
                "severity": record.severity,
                "description": record.description,
                "confidence": record.confidence
            })

    # 2. Check Phone numbers
    for phone in entities.get("phone_numbers", []):
        record = db.query(ThreatIntelFeed).filter(
            ThreatIntelFeed.indicator_type == "phone_number",
            ThreatIntelFeed.indicator_value == phone
        ).first()
        if record:
            matches.append({
                "type": "phone_number",
                "value": phone,
                "source": record.threat_actor_or_source,
                "severity": record.severity,
                "description": record.description,
                "confidence": record.confidence
            })

    # 3. Check URLs / Domains
    for domain in entities.get("domains", []):
        record = db.query(ThreatIntelFeed).filter(
            ThreatIntelFeed.indicator_type == "url_domain",
            ThreatIntelFeed.indicator_value.ilike(f"%{domain}%")
        ).first()
        if record:
            matches.append({
                "type": "url_domain",
                "value": domain,
                "source": record.threat_actor_or_source,
                "severity": record.severity,
                "description": record.description,
                "confidence": record.confidence
            })

    return matches
