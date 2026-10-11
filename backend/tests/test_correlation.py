def test_correlation_graph_generation(client):
    response = client.get("/api/graph")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert data["total_connected_cases"] >= 2
    # Verify at least one shared VPA relationship exists from the seed dataset
    vpa_edges = [e for e in data["edges"] if e["relationship_type"] == "shared_upi_vpa"]
    assert len(vpa_edges) > 0
