from app.engine.normalizer import normalize_text, normalize_phone_number, normalize_upi_id, normalize_url
from app.engine.extractors import extract_entities
from app.engine.rules import evaluate_rules, RuleMatch
from app.engine.scorer import calculate_score_and_assessment, RISK_BANDS
from app.engine.correlator import correlate_case_with_corpus

__all__ = [
    "normalize_text",
    "normalize_phone_number",
    "normalize_upi_id",
    "normalize_url",
    "extract_entities",
    "evaluate_rules",
    "RuleMatch",
    "calculate_score_and_assessment",
    "RISK_BANDS",
    "correlate_case_with_corpus",
]

