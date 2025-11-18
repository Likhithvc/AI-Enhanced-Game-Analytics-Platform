from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import pandas as pd
import io
from app.db import get_db
from app.models import Session

router = APIRouter(prefix="/api/v1/exports", tags=["exports"])

@router.get("", response_class=Response)
async def export_sessions(
    from_: Optional[str] = Query(None, alias="from", description="Start ISO date (YYYY-MM-DD)"),
    to: Optional[str] = Query(None, description="End ISO date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Export labeled session features as a Parquet file for model training.
    """
    try:
        to_dt = datetime.fromisoformat(to) if to else datetime.utcnow()
        from_dt = datetime.fromisoformat(from_) if from_ else to_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid from/to date format. Use YYYY-MM-DD")

    stmt = select(Session).where(
        and_(Session.session_start >= from_dt, Session.session_start <= to_dt)
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()

    # Example feature extraction: id, user_id, session_start, session_end, duration, platform, game_version, final_score
    rows = []
    for s in sessions:
        features = {
            "session_id": str(s.id),
            "user_id": str(s.user_id),
            "session_start": s.session_start,
            "session_end": s.session_end,
            "duration_seconds": s.duration_seconds,
            "platform": s.platform,
            "game_version": s.game_version,
            "final_score": (s.meta or {}).get("final_score"),
        }
        rows.append(features)
    df = pd.DataFrame(rows)
    buf = io.BytesIO()
    df.to_parquet(buf, index=False)
    buf.seek(0)
    return Response(content=buf.read(), media_type="application/octet-stream", headers={"Content-Disposition": "attachment; filename=sessions_export.parquet"})
