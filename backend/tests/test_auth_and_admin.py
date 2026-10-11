def test_unauthorized_access_rejected(client):
    # Try adding note without auth
    resp = client.post("/api/cases/1/notes", json={"content": "Unauthorized note"})
    assert resp.status_code == 401

    # Try accessing stats without auth
    stats_resp = client.get("/api/admin/stats")
    assert stats_resp.status_code == 401

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
