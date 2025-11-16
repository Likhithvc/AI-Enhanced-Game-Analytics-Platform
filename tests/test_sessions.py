import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_session_start():
    response = client.post("/sessions/start", json={"user_id": "test_user"})
    assert response.status_code == 201
    data = response.json()
    assert "session_id" in data
