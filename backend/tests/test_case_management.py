def test_list_and_filter_cases(client):
    # List all cases
    response = client.get("/api/cases")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) > 0

    # Filter by risk
    high_res = client.get("/api/cases?risk=critical")
    assert high_res.status_code == 200
    critical_cases = high_res.json()
    for c in critical_cases:
        assert c["risk_category"] == "critical"

def test_get_case_detail_by_reference(client):
    # Retrieve first case
    cases = client.get("/api/cases").json()
    first_case = cases[0]
    ref = first_case["case_reference"]

    response = client.get(f"/api/cases/ref/{ref}")
    assert response.status_code == 200
    detail = response.json()
    assert detail["case_reference"] == ref
    assert "evidences" in detail
    assert "indicators" in detail
