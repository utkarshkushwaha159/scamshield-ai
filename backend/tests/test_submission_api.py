def test_valid_evidence_submission(client):
    payload = {
        "evidence_items": [
            {
                "evidence_type": "sms",
                "content": "Urgent: Your electricity will disconnect tonight at 9 PM. Call officer at 9876543210 immediately.",
                "sender_or_source": "SMS-UNKNOWN"
            }
        ],
        "user_notes": "Received this text message unexpectedly."
    }
    response = client.post("/api/submit", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "case_reference" in data
    assert data["case_reference"].startswith("SCAM-")
    assert data["risk_category"] in ["medium", "high", "critical"]

    assert len(data["indicators"]) > 0
    assert len(data["safe_recommendations"]) > 0

def test_empty_submission_validation(client):
    payload = {
        "evidence_items": [],
        "user_notes": "empty"
    }
    response = client.post("/api/submit", json=payload)
    assert response.status_code == 422 or response.status_code == 400
