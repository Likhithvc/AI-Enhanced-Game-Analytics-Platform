from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
import logging

router = APIRouter()

# In-memory counters (for demo; use Redis/DB for production)
events_received_total = 0
sessions_created_total = 0


def inc_events(n=1):
    global events_received_total
    events_received_total += n
    logging.getLogger("metrics").info(f"events_received_total incremented by {n}")


def inc_sessions(n=1):
    global sessions_created_total
    sessions_created_total += n
    logging.getLogger("metrics").info(f"sessions_created_total incremented by {n}")


@router.get("/metrics", response_class=PlainTextResponse)
def metrics():
    return f"events_received_total {events_received_total}\nsessions_created_total {sessions_created_total}\n"
