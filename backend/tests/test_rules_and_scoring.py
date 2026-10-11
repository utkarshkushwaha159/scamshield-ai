from app.engine.normalizer import normalize_text
from app.engine.extractors import extract_entities
from app.engine.rules import evaluate_rules
from app.engine.scorer import calculate_score_and_assessment

def test_upi_inverted_flow_detection():
    text = "Sir, to receive Rs 2500 refund, please approve collect request and enter your UPI PIN immediately."
    norm = normalize_text(text)
    ents = extract_entities(norm)
    matches = evaluate_rules(norm, ents)
    res = calculate_score_and_assessment(matches, norm, ents)

    rule_ids = [m.rule_id for m in matches]
    assert "RULE_UPI_COLLECT_REVERSE_FLOW" in rule_ids
    assert res["risk_category"] in ["high", "critical"]
    assert "UPI Inverted Collect / PIN Deception" in res["primary_threat_type"]
    assert any("NEVER enter your UPI PIN" in r for r in res["safe_recommendations"])

def test_remote_access_anydesk_detection():
    text = "Call SBI support at 9876543210 and install AnyDesk app to verify your refund."
    norm = normalize_text(text)
    ents = extract_entities(norm)
    assert "anydesk" in ents["remote_tools"]
    matches = evaluate_rules(norm, ents)
    res = calculate_score_and_assessment(matches, norm, ents)

    rule_ids = [m.rule_id for m in matches]
    assert "RULE_REMOTE_ACCESS_APP" in rule_ids
    assert res["risk_score"] >= 30.0

def test_electricity_disconnection_threat():
    text = "Dear consumer electricity power will disconnect tonight at 9:30 PM due to unpaid bill. Call officer immediately at 9876543210."
    norm = normalize_text(text)
    ents = extract_entities(norm)
    matches = evaluate_rules(norm, ents)
    res = calculate_score_and_assessment(matches, norm, ents)

    rule_ids = [m.rule_id for m in matches]
    assert "RULE_ELECTRICITY_BILL_THREAT" in rule_ids
    assert "Utility Disconnection Pretext" in res["primary_threat_type"]

def test_legitimate_message_low_score():
    text = "Your OTP for transaction at Swiggy is 849201. Valid for 10 mins. Do not share with anyone."
    norm = normalize_text(text)
    ents = extract_entities(norm)
    matches = evaluate_rules(norm, ents)
    res = calculate_score_and_assessment(matches, norm, ents)

    # Legitimate transactional OTP alert should not be classified as high risk or critical
    assert res["risk_category"] == "low"
    assert res["risk_score"] < 25.0
