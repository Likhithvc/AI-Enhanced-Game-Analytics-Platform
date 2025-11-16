import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)

def test_events_batch_inserts():
    events = [
        {"event_type": "move", "x": 1, "y": 2, "timestamp": "2025-11-16T12:00:00Z"},
        {"event_type": "jump", "x": 3, "y": 4, "timestamp": "2025-11-16T12:00:01Z"}
    ]
    with patch("app.api.events.insert_events_to_db") as mock_insert:
        mock_insert.return_value = None
        response = client.post("/events/batch", json={"session_id": "abc123", "events": events})
        assert response.status_code == 200
        mock_insert.assert_called_once()
