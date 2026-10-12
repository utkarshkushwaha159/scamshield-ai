from unittest.mock import patch

def test_unauthorized_access_rejected(client):
    # Try adding note without auth
    resp = client.post("/api/cases/1/notes", json={"content": "Unauthorized note"})
    assert resp.status_code == 401

    # Try accessing stats without auth
    stats_resp = client.get("/api/admin/stats")
    assert stats_resp.status_code == 401


def test_invalid_and_expired_token_rejected(client):
    # Completely bogus token
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.expired.token"})
    assert resp.status_code == 401

    # Missing authorization header on protected route
    resp_missing = client.get("/api/auth/me")
    assert resp_missing.status_code == 401


def test_login_and_privileged_workflow(client):
    # 1. Login as seeded analyst
    login_resp = client.post("/api/auth/login", json={
        "username": "analyst",
        "password": "Analyst@ScamShield2026!"
    })
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Add an analyst note with valid token
    note_resp = client.post("/api/cases/1/notes", json={"content": "Verified fraudulent caller ID."}, headers=headers)
    assert note_resp.status_code == 200
    assert note_resp.json()["content"] == "Verified fraudulent caller ID."

    # 3. Update case status with valid token and rationale
    status_resp = client.patch(
        "/api/cases/1/status",
        json={"new_status": "verified_scam", "reason": "Confirmed active scam pattern matching repository signatures."},
        headers=headers
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "verified_scam"

    # 4. View real database stats
    stats_resp = client.get("/api/admin/stats", headers=headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_cases"] >= 1
    assert stats["total_evidences"] >= 1


@patch("app.routers.auth.verify_firebase_id_token")
@patch("app.routers.auth.is_firebase_configured")
def test_firebase_login_provisions_default_user_role(mock_configured, mock_verify, client):
    mock_configured.return_value = True
    mock_verify.return_value = {
        "uid": "firebase_citizen_123",
        "email": "citizen@example.com",
        "name": "Citizen User",
    }

    # 1. Exchange Firebase ID token
    resp = client.post("/api/auth/firebase-login", json={"id_token": "valid_mock_firebase_id_token"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "USER"
    assert "access_token" in data
    token = data["access_token"]

    user_headers = {"Authorization": f"Bearer {token}"}

    # 2. Citizen USER cannot access analyst stats (403 Forbidden)
    stats_resp = client.get("/api/admin/stats", headers=user_headers)
    assert stats_resp.status_code == 403

    # 3. Citizen USER cannot access admin user creation (403 Forbidden)
    create_resp = client.post("/api/admin/users", json={
        "username": "intruder",
        "email": "intruder@scamshield.local",
        "password": "Password123!",
        "full_name": "Intruder",
        "role": "analyst"
    }, headers=user_headers)
    assert create_resp.status_code == 403

    # 4. Citizen USER can view their own profile (200 OK)
    me_resp = client.get("/api/auth/me", headers=user_headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["role"] == "USER"
    assert me_data["email"] == "citizen@example.com"


@patch("app.services.auth_service.verify_firebase_id_token")
def test_direct_firebase_bearer_token_verification(mock_verify, client):
    mock_verify.return_value = {
        "uid": "firebase_direct_citizen_456",
        "email": "direct_citizen@example.com",
        "name": "Direct Citizen",
    }

    direct_headers = {"Authorization": "Bearer direct_firebase_token"}

    # Verified direct Firebase bearer token provides authenticated profile
    me_resp = client.get("/api/auth/me", headers=direct_headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["role"] == "USER"

    # Default USER role is rejected with 403 on privileged analyst routes
    stats_resp = client.get("/api/admin/stats", headers=direct_headers)
    assert stats_resp.status_code == 403
