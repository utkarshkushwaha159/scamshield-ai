import pytest
from app.models.user import User
from app.services.auth_service import hash_password, create_access_token

def test_hindi_submission_and_translation(client, db_session):
    hindi_text = "प्रिय ग्राहक, आपका बिजली कनेक्शन आज रात 9:30 बजे काट दिया जाएगा। तुरंत कॉल करें 9876543210"
    payload = {
        "evidence_items": [
            {
                "evidence_type": "sms",
                "content": hindi_text,
                "sender_or_source": "SMS-DISCOM"
            }
        ],
        "user_notes": "Received in Hindi on phone",
        "consent_to_analyze": True
    }
    resp = client.post("/api/submit", json=payload)
    assert resp.status_code == 201
    data = resp.json()

    # Verify source language detection and risk scoring
    assert data["source_language"] == "hi"
    assert data["risk_score"] >= 25
    assert data["risk_category"] in ["high", "medium", "critical"]

    # Verify case details
    case_ref = data["case_reference"]
    case_resp = client.get(f"/api/cases/ref/{case_ref}")
    assert case_resp.status_code == 200
    case_data = case_resp.json()

    # Original evidence must match EXACTLY (Unicode preserved)
    assert any(hindi_text in ev["raw_content"] for ev in case_data["evidences"])
    # English translation must be generated
    assert "translations" in case_data
    assert "en" in case_data["translations"]
    assert len(case_data["translations"]["en"]) > 0


def test_bengali_submission(client):
    bengali_text = "আপনার এসবিআই অ্যাকাউন্ট সাময়িক নিষ্ক্রিয় করা হয়েছে। অবিলম্বে প্যান কার্ড আপডেট করুন"
    payload = {
        "evidence_items": [
            {
                "evidence_type": "sms",
                "content": bengali_text,
                "sender_or_source": "SMS-BANK"
            }
        ],
        "user_notes": "Bengali bank warning message",
        "consent_to_analyze": True
    }
    resp = client.post("/api/submit", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["source_language"] == "bn"


def test_privacy_case_deletion_ownership(client, db_session):
    # 1. Create two distinct users
    user1 = User(
        username="rahul_user",
        email="rahul@example.com",
        full_name="Rahul Sharma",
        hashed_password=hash_password("UserPass123!"),
        role="USER",
        preferred_language="hi"
    )
    user2 = User(
        username="sneha_user",
        email="sneha@example.com",
        full_name="Sneha Patel",
        hashed_password=hash_password("UserPass123!"),
        role="USER",
        preferred_language="en"
    )
    db_session.add_all([user1, user2])
    db_session.commit()

    token1 = create_access_token({"sub": "rahul_user", "role": "USER", "user_id": user1.id})
    token2 = create_access_token({"sub": "sneha_user", "role": "USER", "user_id": user2.id})

    # 2. User 1 submits a report while authenticated
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    sub_resp = client.post(
        "/api/submit",
        json={
            "evidence_items": [
                {
                    "evidence_type": "chat",
                    "content": "Confidential scam message sent to Rahul: send money to scam@upi",
                    "sender_or_source": "WhatsApp"
                }
            ],
            "user_notes": "Private report",
            "consent_to_analyze": True
        },
        headers=headers1
    )
    assert sub_resp.status_code == 201
    case_id = sub_resp.json()["case_id"]

    # 3. User 2 tries to delete User 1's case -> Must be rejected with 403 Forbidden
    del_resp_unauthorized = client.delete(f"/api/cases/{case_id}", headers=headers2)
    assert del_resp_unauthorized.status_code == 403
    assert "Permission denied" in del_resp_unauthorized.json()["detail"]

    # 4. User 1 deletes their own case -> Must succeed with 200
    del_resp_authorized = client.delete(f"/api/cases/{case_id}", headers=headers1)
    assert del_resp_authorized.status_code == 200

    # 5. Case should now be gone (404)
    get_resp = client.get(f"/api/cases/{case_id}", headers=headers1)
    assert get_resp.status_code == 404
