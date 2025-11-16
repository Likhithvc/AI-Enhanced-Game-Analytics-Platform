from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db


router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/summary")
async def analytics_summary(
    user_id: Optional[str] = Query(default=None, description="Filter by user UUID"),
    from_: Optional[str] = Query(default=None, alias="from", description="Start ISO date (YYYY-MM-DD)"),
    to: Optional[str] = Query(default=None, description="End ISO date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
):
    """Returns per-day aggregates: games_played and avg_score.

    - games_played: number of game_over events per day
    - avg_score: average of payload.final_score on game_over events per day
    """
    try:
        if to:
            to_dt = datetime.fromisoformat(to)
        else:
            to_dt = datetime.utcnow()
        if from_:
            from_dt = datetime.fromisoformat(from_)
        else:
            from_dt = to_dt - timedelta(days=7)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid from/to date format. Use YYYY-MM-DD")

    params = {"from": from_dt, "to": to_dt}
    where_user = ""
    if user_id:
        where_user = "AND user_id = :user_id"
        params["user_id"] = user_id

    sql = text(
        f"""
        SELECT
          DATE(timestamp) AS day,
          COUNT(*) FILTER (WHERE event_name = 'game_over') AS games_played,
          AVG( (payload->>'final_score')::float ) FILTER (WHERE event_name = 'game_over') AS avg_score
        FROM events
        WHERE timestamp >= :from AND timestamp < :to
        {where_user}
        GROUP BY day
        ORDER BY day
        """
    )

    result = await db.execute(sql, params)
    rows = [
        {
            "day": r.day.isoformat(),
            "games_played": int(r.games_played or 0),
            "avg_score": float(r.avg_score) if r.avg_score is not None else None,
        }
        for r in result
    ]
    return {"from": from_dt.date().isoformat(), "to": to_dt.date().isoformat(), "data": rows}
