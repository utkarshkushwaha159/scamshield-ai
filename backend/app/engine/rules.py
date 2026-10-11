import re
from typing import List, Dict, Any
from app.engine.extractors import URL_SHORTENERS, SUSPICIOUS_TLDS

class RuleMatch:
    def __init__(
        self,
        rule_id: str,
        name: str,
        category: str,
        severity: str,
        score_contribution: float,
        explanation: str,
        matched_value: str = "",
        confidence: float = 1.0
    ):
        self.rule_id = rule_id
        self.name = name
        self.category = category
        self.severity = severity
        self.score_contribution = score_contribution
        self.explanation = explanation
        self.matched_value = matched_value
        self.confidence = confidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "rule_name": self.name,
            "category": self.category,
            "severity": self.severity,
            "score_contribution": self.score_contribution,
            "explanation": self.explanation,
            "matched_value": self.matched_value,
            "confidence": self.confidence,
        }

def evaluate_rules(text: str, entities: Dict[str, Any]) -> List[RuleMatch]:
    """
    Evaluates transparent, deterministic detection rules against normalized text and extracted entities.
    """
    matches: List[RuleMatch] = []
    lower_text = text.lower()

    # Rule 1: Request for Credential / OTP / PIN / MPIN (RULE_OTP_PIN_DEMAND)
    if entities.get("has_otp_pin_request"):
        matched_sample = ""
        m = re.search(r"\b(share|send|enter|verify|provide|forward|give|fill)\b.{0,40}\b(otp|pin|cvv|mpin|password|passcode)\b", lower_text)
        if m:
            matched_sample = m.group(0)
        matches.append(RuleMatch(
            rule_id="RULE_OTP_PIN_DEMAND",
            name="Demands for Secret Security Credentials (OTP/PIN/CVV)",
            category="credential_theft",
            severity="critical",
            score_contribution=35.0,
            explanation="Legitimate banks and payment service providers NEVER ask customers to disclose their OTP, UPI PIN, or CVV. Demanding this information is a primary indicator of credential harvesting and account compromise.",
            matched_value=matched_sample or "Request to share or enter OTP/PIN detected",
            confidence=0.98
        ))

    # Rule 2: Reverse UPI Flow / Collect Request Scam (RULE_UPI_COLLECT_REVERSE_FLOW)
    # The scammer tricks the victim into believing they must enter a PIN or accept a collect request to receive funds.
    has_receive_intent = bool(re.search(r"\b(receive|claim|accept|credit|got|refund|cashback|prize|winner)\b", lower_text))
    has_pay_action = bool(re.search(r"\b(enter\s*pin|upi\s*pin|click\s*pay|pay\s*now|approve\s*request|collect\s*request)\b", lower_text))
    if has_receive_intent and has_pay_action:
        m = re.search(r"\b(receive|claim|refund|cashback)\b.{0,60}\b(pin|pay|collect)\b", lower_text)
        matches.append(RuleMatch(
            rule_id="RULE_UPI_COLLECT_REVERSE_FLOW",
            name="Inverted UPI Payment Flow (PIN Required to Receive Funds)",
            category="payment_manipulation",
            severity="critical",
            score_contribution=35.0,
            explanation="UPI architecture fundamentally does NOT require entering a PIN to receive money. Any communication directing a user to enter an MPIN or approve a collect request to claim or receive money is fraudulent.",
            matched_value=m.group(0) if m else "Entering PIN requested to receive funds",
            confidence=0.99
        ))

    # Rule 3: Remote Desktop / Screen Sharing Tool Solicitation (RULE_REMOTE_ACCESS_APP)
    if entities.get("remote_tools"):
        matched_tools = ", ".join(entities["remote_tools"])
        matches.append(RuleMatch(
            rule_id="RULE_REMOTE_ACCESS_APP",
            name="Solicitation of Remote Desktop / Screen-Sharing Application",
            category="device_takeover",
            severity="critical",
            score_contribution=35.0,
            explanation=f"Caller or message instructs installing remote access software ({matched_tools}). Scammers use these tools to view OTPs and take control of mobile banking sessions in real time.",
            matched_value=f"Remote access software mentioned: {matched_tools}",
            confidence=1.0
        ))

    # Rule 4: Fake Electricity Bill / Essential Service Disconnection (RULE_ELECTRICITY_BILL_THREAT)
    if re.search(r"\b(electricity|power|bijli|bses|tneb|dhbvn|wbsedcl|discom)\b", lower_text) and \
       re.search(r"\b(disconnect|power\s*cut|tonight|blocked|helpline|bill\s*pending|officer)\b", lower_text):
        m = re.search(r"\b(electricity|bijli).{0,50}(disconnect|power\s*cut|tonight)\b", lower_text)
        matches.append(RuleMatch(
            rule_id="RULE_ELECTRICITY_BILL_THREAT",
            name="Coercive Utility Disconnection Pretext",
            category="social_engineering",
            severity="high",
            score_contribution=32.0,
            explanation="Scammers send fraudulent SMS warnings claiming residential electricity will be disconnected tonight due to unpaid bills, prompting victims to call an unofficial mobile number or download a malicious APK.",
            matched_value=m.group(0) if m else "Threat of imminent electricity disconnection",
            confidence=0.95
        ))


    # Rule 5: Bank KYC / Account Suspension Impersonation (RULE_KYC_ACCOUNT_SUSPENSION)
    if re.search(r"\b(kyc|pan\s*card|aadhaar|sim\s*block|account\s*block|dormant|deactivat)\b", lower_text) and \
       re.search(r"\b(suspend|block|expire|update|verify|immediate|link)\b", lower_text):
        m = re.search(r"\b(kyc|account|sim).{0,40}(block|suspend|expire|update)\b", lower_text)
        matches.append(RuleMatch(
            rule_id="RULE_KYC_ACCOUNT_SUSPENSION",
            name="Bank KYC / Account Suspension Impersonation",
            category="impersonation",
            severity="high",
            score_contribution=25.0,
            explanation="Fraudsters impersonate financial institutions threatening account closure or PAN deactivation unless an urgent KYC verification link is clicked. Official Indian banks do not mandate KYC updates via SMS hyperlinks.",
            matched_value=m.group(0) if m else "Imminent account suspension or KYC threat",
            confidence=0.90
        ))

    # Rule 6: Unverified APK or Direct App Download (RULE_UNVERIFIED_APK_DOWNLOAD)
    if entities.get("has_apk_download"):
        matches.append(RuleMatch(
            rule_id="RULE_UNVERIFIED_APK_DOWNLOAD",
            name="Unverified Android Package (APK) Installation Request",
            category="malware_distribution",
            severity="high",
            score_contribution=25.0,
            explanation="Direct requests to download and sideload APK files bypass official store safety controls (Google Play Protect). Malicious APKs are commonly used in banking malware to intercept SMS OTPs.",
            matched_value="Instruction to download or sideload APK file",
            confidence=0.94
        ))

    # Rule 7: Suspicious URL Shortener, Raw IP Host, or Suspicious TLD (RULE_SUSPICIOUS_URL_SHORTENER_OR_IP)
    for domain in entities.get("domains", []):
        is_shortener = any(domain.endswith(short) for short in URL_SHORTENERS)
        is_suspicious_tld = any(domain.endswith(tld) for tld in SUSPICIOUS_TLDS)
        is_ip_host = bool(re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", domain))

        if is_shortener or is_suspicious_tld or is_ip_host:
            reason = "URL shortener hiding destination" if is_shortener else ("Direct IP host without registered domain" if is_ip_host else f"High-risk top level domain: {domain}")
            matches.append(RuleMatch(
                rule_id="RULE_SUSPICIOUS_URL_SHORTENER_OR_IP",
                name="Suspicious Link Infrastructure (Obfuscated / Unverified TLD)",
                category="suspicious_infrastructure",
                severity="medium",
                score_contribution=18.0,
                explanation=f"Communication contains obfuscated or high-risk web hosting: {reason}. Financial entities always use their authenticated registered corporate domains.",
                matched_value=domain,
                confidence=0.88
            ))
            break

    # Rule 8: Unofficial Customer Care / Support Impersonation (RULE_FAKE_CUSTOMER_CARE_IMPERSONATION)
    if re.search(r"\b(customer\s*care|support\s*helpline|toll\s*free|help\s*desk|officer|helpline|executive)\b", lower_text) and entities.get("phone_numbers"):
        matches.append(RuleMatch(
            rule_id="RULE_FAKE_CUSTOMER_CARE_IMPERSONATION",
            name="Unofficial Support / Personal Mobile Helpline Impersonation",
            category="impersonation",
            severity="high",
            score_contribution=22.0,
            explanation="Communication claims to be official customer service or an institutional officer but directs the user to contact a personal 10-digit mobile number rather than verified corporate/discom channels.",
            matched_value=f"Helpline/officer directing to mobile number: {entities['phone_numbers'][0]}",
            confidence=0.90
        ))


    # Rule 9: Part-Time Job / Task / Guaranteed Return Scam (RULE_LOTTERY_JOB_PART_TIME_TASK)
    if re.search(r"\b(part\s*time\s*job|earn\s*daily|youtube\s*like|telegram\s*task|work\s*from\s*home|daily\s*income|guaranteed\s*return)\b", lower_text) and \
       (entities.get("amounts") or re.search(r"\b(rs|inr|investment|bonus)\b", lower_text)):
        matches.append(RuleMatch(
            rule_id="RULE_LOTTERY_JOB_PART_TIME_TASK",
            name="Deceptive High-Yield Task / Part-Time Job Scheme",
            category="financial_fraud",
            severity="medium",
            score_contribution=20.0,
            explanation="Promise of easy daily income by liking YouTube videos or completing tasks on Telegram. These invariably escalate into deposit demands where victims cannot withdraw funds.",
            matched_value="Daily income / task-based investment promise",
            confidence=0.89
        ))

    # Rule 10: Manufactured Time Urgency & Coercive Pressure (RULE_TIME_URGENCY_COERCION)
    if entities.get("has_urgency"):
        m = re.search(r"\b(within\s*\d+\s*(?:mins?|minutes?|hours?)|immediate(?:ly)?|urgent(?:ly)?|24\s*hours|expire(?:s|d)?\s*today)\b", lower_text)
        matches.append(RuleMatch(
            rule_id="RULE_TIME_URGENCY_COERCION",
            name="Manufactured Time Urgency and Psychological Coercion",
            category="social_engineering",
            severity="low",
            score_contribution=12.0,
            explanation="Message applies aggressive time limits to induce panic and prevent deliberate independent verification with the actual financial institution.",
            matched_value=m.group(0) if m else "Strict deadline to force immediate action",
            confidence=0.82
        ))

    # Rule 11: Unclaimed Lottery / Cashback / Reward Trap (RULE_CASHBACK_REFUND_ENTICEMENT)
    if re.search(r"\b(congratulations|you\s*have\s*won|unclaimed|lottery|lucky\s*draw|cashback\s*reward)\b", lower_text) and \
       (entities.get("urls") or entities.get("upi_ids")):
        matches.append(RuleMatch(
            rule_id="RULE_CASHBACK_REFUND_ENTICEMENT",
            name="Unsolicited Prize / Cashback / Reward Lure",
            category="enticement",
            severity="medium",
            score_contribution=18.0,
            explanation="Unsolicited reward notifications lure victims to malicious landing pages or UPI collect requests under the false pretense of receiving money.",
            matched_value="Prize or cashback lure associated with payment action",
            confidence=0.85
        ))

    return matches
