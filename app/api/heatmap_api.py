from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db


router = APIRouter(prefix="/api/v1", tags=["heatmap"])


@router.get("/heatmap")
async def get_heatmap(level: str = Query(...), date: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Returns heatmap matrix JSON for a given level and date (YYYY-MM-DD)."""
    try:
        target_date = datetime.fromisoformat(date).date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Query heatmaps table (created by scripts/heatmap.py)
    sql = text(
        """
        SELECT matrix
        FROM heatmaps
        WHERE level = :level AND date = :date
        """
    )
    result = await db.execute(sql, {"level": level, "date": target_date})
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Heatmap not found for specified level/date")
    return {"level": level, "date": target_date.isoformat(), "matrix": row.matrix}
