import re
from urllib.parse import urlparse
from typing import Dict, List, Any
from app.engine.normalizer import normalize_phone_number, normalize_upi_id

# Common UPI handles in India
COMMON_UPI_HANDLES = {
    "okaxis", "okhdfcbank", "okicici", "oksbi", "ybl", "ibl", "axl", "paytm",
    "apl", "postbank", "upi", "barodampay", "fbl", "idfcbank", "kotak", "indus",
    "allbank", "pnb", "rbl", "yesbank", "airtel", "jupiteraxis", "sliceaxis"
}

# Remote desktop tools frequently misused in technical-support and banking scams
REMOTE_ACCESS_TOOLS = [
    "anydesk", "teamviewer", "quicksupport", "rustdesk", "ultraviewer",
    "zoho assist", "screen share", "splashtop", "airmirror", "supremo"
]

# Common URL shorteners or suspicious hosting patterns
URL_SHORTENERS = [
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "rb.gy", "cutt.ly",
    "shorturl.at", "ow.ly", "buff.ly", "rebrand.ly"
]

SUSPICIOUS_TLDS = [
    ".xyz", ".top", ".click", ".club", ".work", ".site", ".online", ".live",
    ".vip", ".gq", ".ml", ".cf", ".ga", ".tk", ".fit", ".rest"
]

def extract_entities(text: str) -> Dict[str, Any]:
    """
    Extracts structured entities from text:
    - UPI IDs
    - Phone Numbers
    - URLs & Domains
    - Remote Access Mentions
    - Financial Amounts
    - Action Verbs / Keywords
    """
    entities: Dict[str, Any] = {
        "upi_ids": [],
        "phone_numbers": [],
        "urls": [],
        "domains": [],
        "remote_tools": [],
        "amounts": [],
        "has_otp_pin_request": False,
        "has_collect_request": False,
        "has_urgency": False,
        "has_apk_download": False,
        "has_impersonation": False,
    }

    # 1. UPI ID extraction (e.g., username@bankhandle or alphanumeric@handle)
    upi_pattern = re.compile(r"\b([a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,32})\b", re.IGNORECASE)
    for match in upi_pattern.finditer(text):
        raw_vpa = match.group(1)
        handle = raw_vpa.split("@")[-1].lower()
        if handle in COMMON_UPI_HANDLES or len(handle) <= 12:
            normalized_vpa = normalize_upi_id(raw_vpa)
            if normalized_vpa not in entities["upi_ids"]:
                entities["upi_ids"].append(normalized_vpa)

    # 2. Phone number extraction (India 10-digit mobile numbers with optional prefix)
    phone_pattern = re.compile(r"(?:(?:\+91|91|0)?[-\s]?)?([6-9]\d{9})\b")
    for match in phone_pattern.finditer(text):
        normalized_num = normalize_phone_number(match.group(1))
        if normalized_num not in entities["phone_numbers"]:
            entities["phone_numbers"].append(normalized_num)

    # 3. URL extraction
    url_pattern = re.compile(r"(https?://[^\s/$.?#].[^\s]*|[a-zA-Z0-9.-]+\.(?:com|org|in|net|xyz|top|site|click|live|club|app|info|biz|co)[^\s]*)", re.IGNORECASE)
    for match in url_pattern.finditer(text):
        url_cand = match.group(0).rstrip(".,;:!?)'\"")
        if "@" in url_cand and not url_cand.startswith("http"):
            # Avoid confusing emails/UPIs with URLs
            continue
        if "." in url_cand:
            parsed_url = url_cand if url_cand.startswith(("http://", "https://")) else "http://" + url_cand
            try:
                parsed = urlparse(parsed_url)
                domain = parsed.netloc.lower()
                if domain and domain not in entities["domains"]:
                    entities["domains"].append(domain)
                if url_cand not in entities["urls"]:
                    entities["urls"].append(url_cand)
            except Exception:
                pass

    # 4. Remote tool detection
    lower_text = text.lower()
    for tool in REMOTE_ACCESS_TOOLS:
        if tool in lower_text and tool not in entities["remote_tools"]:
            entities["remote_tools"].append(tool)

    # 5. Financial amount mentions
    amount_pattern = re.compile(r"(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)|\b([\d,]+)\s*(?:rs|rupees|inr)\b", re.IGNORECASE)
    for match in amount_pattern.finditer(text):
        amt = match.group(1) or match.group(2)
        if amt:
            cleaned_amt = amt.replace(",", "")
            if cleaned_amt not in entities["amounts"]:
                entities["amounts"].append(cleaned_amt)

    # 6. Flag triggers for specific high-risk scam patterns
    # OTP / PIN requests (check for negative qualifiers like 'do not share' or 'never share')
    has_negative_qualifier = bool(re.search(r"\b(do\s*not\s*share|never\s*share|don'?t\s*share|not\s*to\s*be\s*shared|nobody|bank\s*never\s*asks)\b", lower_text))
    if not has_negative_qualifier and \
       re.search(r"\b(otp|pin|cvv|mpin|password|passcode|secret\s*code|atm\s*pin)\b", lower_text) and \
       re.search(r"\b(share|send|enter|verify|provide|forward|give|fill|submit)\b", lower_text):
        entities["has_otp_pin_request"] = True


    # UPI collect / reverse charge scam pattern
    if re.search(r"\b(collect|request|receive|accept|approve|claim|refund|cashback|reward)\b", lower_text) and \
       re.search(r"\b(pin|enter\s*pin|pay|upi\s*pin|approve\s*request|click\s*pay)\b", lower_text):
        entities["has_collect_request"] = True

    # Time urgency
    if re.search(r"\b(within\s*\d+\s*(?:mins?|minutes?|hours?)|immediate(?:ly)?|urgent(?:ly)?|24\s*hours|expire(?:s|d)?\s*today|block(?:ed)?\s*within|disconnect(?:ed)?\s*tonight)\b", lower_text):
        entities["has_urgency"] = True

    # APK file download
    if re.search(r"\.apk\b|download\s*(?:our)?\s*app|install\s*(?:the)?\s*(?:support|banking|kyc)\s*app", lower_text):
        entities["has_apk_download"] = True

    # Impersonation triggers
    if re.search(r"\b(sbi|hdfc|icici|axis|punjab\s*national|paytm|phonepe|gpay|google\s*pay|electricity\s*department|bses|tneb|wbbsedcl|dhbvn|customer\s*care|bank\s*officer|kyc\s*update)\b", lower_text):
        entities["has_impersonation"] = True

    return entities
