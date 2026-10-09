import io
import zipfile
from fastapi.testclient import TestClient
from app.main import app

def test_auth_login_and_rbac():
    with TestClient(app) as client:
        # 1. Login Admin
        resp = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        assert resp.status_code == 200
        token_data = resp.json()
        assert "access_token" in token_data
        assert token_data["user"]["role"] == "Administrator"

        # 2. Get User Profile with Token
        token = token_data["access_token"]
        me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["username"] == "admin"

        # 3. Invalid credentials test
        bad_resp = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrongpassword"})
        assert bad_resp.status_code == 401

def test_anomaly_alert_lifecycle():
    with TestClient(app) as client:
        # Fetch initial alerts
        alerts_resp = client.get("/api/v1/alerts/anomalies")
        assert alerts_resp.status_code == 200
        alerts = alerts_resp.json()
        assert len(alerts) > 0
        alert_id = alerts[0]["id"]

        # Transition status to ACKNOWLEDGED
        update_resp = client.put(f"/api/v1/alerts/anomalies/{alert_id}/status", json={"status": "ACKNOWLEDGED", "assigned_to": "manager"})
        assert update_resp.status_code == 200
        assert update_resp.json()["new_status"] == "ACKNOWLEDGED"

        # Transition status to RESOLVED
        resolve_resp = client.put(f"/api/v1/alerts/anomalies/{alert_id}/status", json={"status": "RESOLVED", "assigned_to": "manager"})
        assert resolve_resp.status_code == 200
        assert resolve_resp.json()["new_status"] == "RESOLVED"

def test_recommendation_review_workflow():
    with TestClient(app) as client:
        recs_resp = client.get("/api/v1/recommendations")
        assert recs_resp.status_code == 200
        recs = recs_resp.json()
        assert len(recs) > 0
        rec_id = recs[0]["id"]

        # Review Action: APPROVE
        review_resp = client.post(f"/api/v1/recommendations/{rec_id}/review", json={"action": "APPROVE", "reviewed_by": "Ops Director"})
        assert review_resp.status_code == 200
        assert review_resp.json()["new_status"] == "APPROVED"

def test_gtfs_ingestion_validation():
    with TestClient(app) as client:
        # Create an invalid GTFS zip (missing required files)
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w") as z:
            z.writestr("dummy.txt", "hello")
        zip_buffer.seek(0)

        resp = client.post(
            "/api/v1/ingestion/gtfs",
            files={"file": ("invalid_gtfs.zip", zip_buffer, "application/zip")},
            data={"source_name": "Invalid Test GTFS"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "FAILED"
        assert len(data["errors"]) > 0

def test_reports_generation_pdf_csv():
    with TestClient(app) as client:
        # Test PDF Report Download
        pdf_resp = client.get("/api/v1/reports/download?report_type=EXECUTIVE_SUMMARY&format=pdf")
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers["content-type"] == "application/pdf"
        assert len(pdf_resp.content) > 100

        # Test CSV Report Download
        csv_resp = client.get("/api/v1/reports/download?report_type=ROUTE_PERFORMANCE&format=csv")
        assert csv_resp.status_code == 200
        assert csv_resp.headers["content-type"] == "text/csv; charset=utf-8"
        assert "Route ID" in csv_resp.text

def test_gis_layers():
    with TestClient(app) as client:
        resp = client.get("/api/v1/gis/layers")
        assert resp.status_code == 200
        data = resp.json()
        assert "routes" in data
        assert "stops" in data
        assert len(data["routes"]) > 0
