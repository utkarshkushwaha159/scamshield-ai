import re
import unicodedata

def normalize_text(text: str) -> str:
    """
    Normalizes text by stripping invisible zero-width characters,
    normalizing unicode forms, and collapsing redundant whitespace.
    """
    if not text:
        return ""
    # NFKD normalization to decompose lookalikes
    normalized = unicodedata.normalize("NFKD", text)
    # Remove zero-width characters (e.g., \u200B, \u200C, \u200D, \uFEFF)
    normalized = re.sub(r"[\u200B-\u200D\uFEFF\u00A0]", " ", normalized)
    # Collapse multiple whitespaces
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized

def normalize_phone_number(raw_phone: str) -> str:
    """
    Normalizes phone numbers to standard 10-digit Indian mobile format or E.164.
    """
    digits = re.sub(r"\D", "", raw_phone)
    if len(digits) == 12 and digits.startswith("91"):
        return "+91" + digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        return "+91" + digits[1:]
    elif len(digits) == 10:
        return "+91" + digits
    return raw_phone.strip()

def normalize_upi_id(vpa: str) -> str:
    """
    Normalizes UPI Virtual Payment Address to lowercase without leading/trailing punctuation.
    """
    cleaned = vpa.strip().lower()
    cleaned = re.sub(r"^[^\w]+|[^\w]+$", "", cleaned)
    return cleaned

def normalize_url(url: str) -> str:
    """
    Normalizes URL string for analysis.
    """
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "http://" + url
    return url.lower()
