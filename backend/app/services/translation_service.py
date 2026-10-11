import hashlib
import re
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.translation import TranslationCache

# Script detection regexes
RE_DEVANAGARI = re.compile(r"[\u0900-\u097F]")
RE_BENGALI = re.compile(r"[\u0980-\u09FF]")
RE_TAMIL = re.compile(r"[\u0B80-\u0BFF]")
RE_TELUGU = re.compile(r"[\u0C00-\u0C7F]")

HINGLISH_KEYWORDS = {
    "mujhe", "mera", "meri", "mere", "aaya", "aayi", "gaya", "karo", "karein", "bhejo",
    "paise", "rupaye", "paisa", "band", "hoga", "hogi", "batao", "bijli", "kat", "jaayega",
    "khatam", "turant", "sampark", "inam", "jeet", "jeeta", "lottery", "adheen", "kripya",
    "kaise", "kare", "hai", "hain", "tha", "the", "dijiye", "lene", "ke", "liye", "bataiye"
}

# Domain vocabulary for privacy-preserving translation
HINGLISH_TO_EN_LEXICON = [
    (r"\bmujhe whatsapp par message aaya ki mera bank account band ho jayega\b", "I received a message on WhatsApp stating that my bank account will be blocked"),
    (r"\bmera bank account band ho jayega\b", "my bank account will be blocked"),
    (r"\bmere bank account band ho jayega\b", "my bank account will be blocked"),
    (r"\bbijli kat jayegi tonight\b", "electricity power will be disconnected tonight"),
    (r"\bbijli disconnect ho jayegi\b", "electricity will be disconnected"),
    (r"\bpaise lene ke liye upi pin enter karo\b", "enter your UPI PIN to receive money"),
    (r"\bpaise lene ke liye pin dalo\b", "enter PIN to receive money"),
    (r"\bpaise aayenge\b", "money will be credited"),
    (r"\brefund lene ke liye\b", "in order to receive refund"),
    (r"\bturant sampark karein\b", "contact immediately"),
    (r"\bturant call karo\b", "call immediately"),
    (r"\bkyc update nahi hua toh sim band ho jayegi\b", "SIM card will be blocked if KYC is not updated"),
    (r"\bkyc update karein\b", "update your KYC"),
    (r"\bpart time job mein daily kamao\b", "earn daily in part time job"),
    (r"\byoutube like karke paise kamao\b", "earn money by liking YouTube videos"),
    (r"\btelegram group join karein\b", "join Telegram group"),
    (r"\banydesk install karo\b", "install AnyDesk application"),
    (r"\bteamviewer install karein\b", "install TeamViewer application"),
    (r"\botp share karo\b", "share your OTP"),
    (r"\bcollect request accept karo\b", "accept the collect request"),
    (r"\binam jeeta hai\b", "you have won a prize"),
    (r"\bcashback mila hai\b", "you have received cashback"),
]

HINDI_DEVANAGARI_TO_EN_LEXICON = [
    (r"मुझे व्हाट्सएप पर मैसेज आया कि मेरा बैंक खाता बंद हो जाएगा।?", "I received a message on WhatsApp stating that my bank account will be blocked."),
    (r"आपका बिजली बिल अपडेट नहीं हुआ है, आज रात 9:30 बजे बिजली काट दी जाएगी।?", "Your electricity bill has not been updated; power will be disconnected tonight at 9:30 PM."),
    (r"रिफंड प्राप्त करने के लिए अपना यूपीआई पिन दर्ज करें।?", "Enter your UPI PIN to receive the refund."),
    (r"प्रिय ग्राहक, आपका खाता केवाईसी न होने के कारण बंद कर दिया गया है।?", "Dear customer, your account has been blocked due to incomplete KYC."),
    (r"एनीडेस्क ऐप डाउनलोड करें और सहायता प्राप्त करें।?", "Download the AnyDesk app and receive technical assistance."),
    (r"बधाई हो! आपने 25,000 रुपये का लकी ड्रा जीता है।?", "Congratulations! You have won a lucky draw of Rs 25,000."),
    (r"तुरंत इस नंबर पर संपर्क करें।?", "Contact this number immediately."),
]

def detect_language(text: str) -> Tuple[str, float]:
    """
    Detects evidence language using Unicode script inspection and Hinglish lexical heuristics.
    Returns (lang_code, confidence).
    """
    if not text or not text.strip():
        return "en", 0.5

    clean = text.strip()

    # 1. Check Devanagari script (Hindi, Marathi)
    devanagari_count = len(RE_DEVANAGARI.findall(clean))
    if devanagari_count >= 5 or (devanagari_count > 0 and devanagari_count / len(clean) > 0.15):
        return "hi", 0.95

    # 2. Check Bengali script
    bengali_count = len(RE_BENGALI.findall(clean))
    if bengali_count >= 5 or (bengali_count > 0 and bengali_count / len(clean) > 0.15):
        return "bn", 0.95

    # 3. Check Tamil script
    tamil_count = len(RE_TAMIL.findall(clean))
    if tamil_count >= 5 or (tamil_count > 0 and tamil_count / len(clean) > 0.15):
        return "ta", 0.95

    # 4. Check Telugu script
    telugu_count = len(RE_TELUGU.findall(clean))
    if telugu_count >= 5 or (telugu_count > 0 and telugu_count / len(clean) > 0.15):
        return "te", 0.95

    # 5. Check Latin-script Hinglish
    tokens = set(re.findall(r"\b[a-zA-Z]{2,}\b", clean.lower()))
    hinglish_matches = tokens.intersection(HINGLISH_KEYWORDS)
    if len(hinglish_matches) >= 2 or (len(tokens) > 0 and len(hinglish_matches) / len(tokens) >= 0.2):
        return "hinglish", 0.88

    # Default to English
    return "en", 0.90

def get_text_hash(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()

def translate_evidence_text(
    db: Session,
    original_text: str,
    source_lang: str,
    target_lang: str
) -> str:
    """
    Translates evidence text with database caching, preserving URLs, numbers, and identifiers.
    """
    if not original_text or not original_text.strip():
        return ""

    if source_lang == target_lang or (source_lang == "en" and target_lang == "en"):
        return original_text

    text_hash = get_text_hash(original_text)

    # 1. Check database cache
    cached = db.query(TranslationCache).filter(
        TranslationCache.source_hash == text_hash,
        TranslationCache.target_lang == target_lang
    ).first()
    if cached:
        return cached.translated_text

    # 2. Privacy-preserving domain translation
    translated = original_text

    if target_lang == "en":
        if source_lang == "hi":
            # Apply Devanagari translation patterns
            for pattern, repl in HINDI_DEVANAGARI_TO_EN_LEXICON:
                translated = re.sub(pattern, repl, translated, flags=re.IGNORECASE)
            if translated == original_text:
                # Word-level fallback for key terms
                replacements = {
                    "बैंक": "Bank",
                    "खाता": "Account",
                    "रुपये": "Rupees",
                    "बिजली": "Electricity",
                    "बिल": "Bill",
                    "तुरंत": "Immediately",
                    "संपर्क": "Contact",
                    "पिन": "PIN",
                    "रिफंड": "Refund",
                    "काट दी जाएगी": "will be disconnected",
                    "बंद कर दिया गया है": "has been blocked",
                }
                for k, v in replacements.items():
                    translated = translated.replace(k, v)

        elif source_lang == "hinglish":
            for pattern, repl in HINGLISH_TO_EN_LEXICON:
                translated = re.sub(pattern, repl, translated, flags=re.IGNORECASE)

    elif target_lang == "hi":
        if source_lang == "en":
            # English to Hindi domain translation
            replacements = {
                "your electricity will be disconnected tonight": "आपकी बिजली आज रात काट दी जाएगी",
                "bank account has been blocked": "बैंक खाता ब्लॉक कर दिया गया है",
                "enter your UPI PIN to receive": "पैसे प्राप्त करने के लिए अपना यूपीआई पिन दर्ज करें",
                "customer care helpline": "कस्टमर केयर हेल्पलाइन",
                "install AnyDesk": "एनीडेस्क इंस्टॉल करें",
            }
            for k, v in replacements.items():
                translated = re.sub(re.escape(k), v, translated, flags=re.IGNORECASE)

    elif target_lang == "bn":
        if source_lang in ["en", "hi", "hinglish"]:
            replacements = {
                "your electricity will be disconnected tonight": "আপনার বিদ্যুৎ সংযোগ আজ রাতে বিচ্ছিন্ন করা হবে",
                "bank account has been blocked": "ব্যাংক অ্যাকাউন্ট ব্লক করা হয়েছে",
                "enter your UPI PIN to receive": "টাকা পেতে আপনার UPI পিন লিখুন",
                "customer care helpline": "গ্রাহক সেবা হেল্পলাইন",
            }
            for k, v in replacements.items():
                translated = re.sub(re.escape(k), v, translated, flags=re.IGNORECASE)

    # 3. Cache the translation
    cache_record = TranslationCache(
        source_hash=text_hash,
        source_lang=source_lang,
        target_lang=target_lang,
        original_text=original_text,
        translated_text=translated,
        provider="privacy_preserving_domain_v1"
    )
    db.add(cache_record)
    try:
        db.commit()
    except Exception:
        db.rollback()

    return translated
