from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_session_start_requires_auth():
    response = client.post(
        "/api/v1/sessions/start",
        json={"user_id": "00000000-0000-0000-0000-000000000001"}
    )
    assert response.status_code in (401, 403, 422)
