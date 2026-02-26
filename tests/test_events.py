from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_events_endpoint_requires_auth():
    response = client.post(
        "/api/v1/events",
        json={"events": []}
    )
    assert response.status_code in (400, 401, 403, 422)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
