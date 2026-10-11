from typing import List, Dict, Any, Tuple
from app.engine.rules import RuleMatch

# Documented risk thresholds
RISK_BANDS = {
    "low": (0.0, 25.0),
    "medium": (25.1, 55.0),
    "high": (55.1, 80.0),
    "critical": (80.1, 100.0),
}

def determine_risk_category(score: float) -> str:
    if score >= 80.1:
        return "critical"
    elif score >= 55.1:
        return "high"
    elif score >= 25.1:
        return "medium"
    return "low"

def calculate_score_and_assessment(
    matches: List[RuleMatch],
    raw_text: str,
    entities: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluates risk score, avoiding double-counting by capping category contributions,
    handling uncertainty, and generating safe actionable next steps.
    """
    # 1. Non-duplicative category aggregation
    category_caps = {
        "credential_theft": 40.0,
        "payment_manipulation": 40.0,
        "device_takeover": 35.0,
        "social_engineering": 35.0,
        "impersonation": 35.0,
        "malware_distribution": 30.0,
        "suspicious_infrastructure": 20.0,
        "financial_fraud": 25.0,
        "enticement": 20.0,
    }


    category_scores: Dict[str, float] = {}
    for match in matches:
        current = category_scores.get(match.category, 0.0)
        # Apply diminishing returns for multiple matches in the same category
        contribution = match.score_contribution * match.confidence
        category_scores[match.category] = current + contribution

    # Apply category caps
    accumulated_score = 0.0
    for cat, score in category_scores.items():
        cap = category_caps.get(cat, 25.0)
        accumulated_score += min(score, cap)

    # Scale and clamp score to [0.0, 100.0]
    final_score = min(round(accumulated_score, 1), 100.0)
    risk_category = determine_risk_category(final_score)

    # 2. Honest uncertainty calculation
    text_length = len(raw_text.strip())
    if text_length < 30 and len(matches) == 0:
        uncertainty = "high"
        confidence_level = 0.4
    elif len(matches) >= 2 and final_score >= 55.0:
        uncertainty = "low"
        confidence_level = 0.95
    elif len(matches) == 1:
        uncertainty = "moderate"
        confidence_level = 0.75
    else:
        uncertainty = "low" if final_score <= 10.0 else "moderate"
        confidence_level = 0.85

    # 3. Determine primary threat type
    rule_ids = {m.rule_id for m in matches}
    if "RULE_UPI_COLLECT_REVERSE_FLOW" in rule_ids:
        primary_threat = "UPI Inverted Collect / PIN Deception"
    elif "RULE_OTP_PIN_DEMAND" in rule_ids:
        primary_threat = "Secret Credential & OTP Harvesting"
    elif "RULE_REMOTE_ACCESS_APP" in rule_ids:
        primary_threat = "Remote Desktop Takeover Fraud"
    elif "RULE_ELECTRICITY_BILL_THREAT" in rule_ids:
        primary_threat = "Utility Disconnection Pretext"
    elif "RULE_KYC_ACCOUNT_SUSPENSION" in rule_ids:
        primary_threat = "Banking KYC / Account Freeze Pretext"
    elif "RULE_UNVERIFIED_APK_DOWNLOAD" in rule_ids:
        primary_threat = "Malicious Android Package (APK) Delivery"
    elif "RULE_LOTTERY_JOB_PART_TIME_TASK" in rule_ids:
        primary_threat = "Part-Time Task & Investment Fraud"
    elif "RULE_SUSPICIOUS_URL_SHORTENER_OR_IP" in rule_ids:
        primary_threat = "Phishing Infrastructure / Obfuscated Link"
    elif "RULE_FAKE_CUSTOMER_CARE_IMPERSONATION" in rule_ids:
        primary_threat = "Unofficial Customer Support Impersonation"
    elif final_score >= 25.0:
        primary_threat = "Suspicious Payment / Social Engineering Pattern"
    else:
        primary_threat = "Low Risk / No High-Confidence Threats Detected"

    # 4. Generate Safe Recommended Actions
    recommendations: List[str] = []

    if "RULE_UPI_COLLECT_REVERSE_FLOW" in rule_ids:
        recommendations.append("NEVER enter your UPI PIN to receive or claim money. In UPI architecture, entering your PIN always debits funds from your account.")
        recommendations.append("Decline any pending collect requests on your UPI app (Google Pay, PhonePe, Paytm, BHIM).")

    if "RULE_OTP_PIN_DEMAND" in rule_ids:
        recommendations.append("Do not disclose the OTP, PIN, or CVV to anyone, even if they claim to be a bank manager or police officer.")
        recommendations.append("If you already shared an OTP, contact your bank immediately to freeze your debit card and digital banking channels.")

    if "RULE_REMOTE_ACCESS_APP" in rule_ids:
        recommendations.append("Do not install AnyDesk, TeamViewer, or QuickSupport on the instruction of an unknown caller.")
        recommendations.append("If installed, disconnect your device from the internet (Wi-Fi/mobile data) and uninstall the application immediately.")

    if "RULE_ELECTRICITY_BILL_THREAT" in rule_ids:
        recommendations.append("Discoms do not send personal mobile numbers for disconnection warnings. Verify bill status exclusively through your official state electricity board portal.")

    if "RULE_KYC_ACCOUNT_SUSPENSION" in rule_ids:
        recommendations.append("Never update bank KYC through SMS links. Visit your nearest bank branch or use the verified official banking mobile app.")

    if "RULE_UNVERIFIED_APK_DOWNLOAD" in rule_ids:
        recommendations.append("Never install APK files sent via WhatsApp, SMS, or Telegram. Only install applications from Google Play Store or Apple App Store.")

    if "RULE_SUSPICIOUS_URL_SHORTENER_OR_IP" in rule_ids:
        recommendations.append("Do not click shortened or obfuscated links. Inspect URLs carefully before interacting with them.")

    # General fallback safe recommendations
    if not recommendations:
        if final_score < 25.0:
            recommendations.append("No overt indicators of malicious intent were detected in the submitted text.")
            recommendations.append("Continue to exercise routine vigilance: verify unexpected payment requests directly with the sender through an independent trusted channel.")
        else:
            recommendations.append("Cease communication with the suspicious party.")
            recommendations.append("Report suspected cyber fraud to the National Cyber Crime Reporting Portal (cybercrime.gov.in) or call 1930.")

    # General safety reminder
    recommendations.append("ScamShield AI provides automated indicator analysis and safe guidance. Never share sensitive payment credentials.")

    # Generate summary explanation
    if matches:
        summary_lines = [f"{m.name} ({m.severity.upper()}): {m.explanation}" for m in matches[:3]]
        summary_text = " ".join(summary_lines)
    else:
        summary_text = "Analysis completed. No known malicious scam indicators, coercive payment flows, or credential harvesting patterns were identified."

    return {
        "risk_score": final_score,
        "risk_category": risk_category,
        "uncertainty_level": uncertainty,
        "primary_threat_type": primary_threat,
        "confidence_score": confidence_level,
        "summary": summary_text,
        "safe_recommendations": recommendations,
        "indicators": [m.to_dict() for m in matches],
    }
