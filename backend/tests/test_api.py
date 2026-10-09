from fastapi.testclient import TestClient
from app.main import app

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"

def test_readiness_check():
    with TestClient(app) as client:
        response = client.get("/readiness")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "READY"

def test_dashboard_kpis_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/dashboard/kpis")
        assert response.status_code == 200
        data = response.json()
        assert "scheduled_trips" in data
        assert "on_time_performance_pct" in data
        assert data["operating_mode"] == "DEMO DATA"

def test_routes_performance_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/routes/performance")
        assert response.status_code == 200
        routes = response.json()
        assert isinstance(routes, list)
        assert len(routes) > 0

def test_predictions_evaluations_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/predictions/evaluations")
        assert response.status_code == 200
        evals = response.json()
        assert isinstance(evals, list)
        assert len(evals) > 0
