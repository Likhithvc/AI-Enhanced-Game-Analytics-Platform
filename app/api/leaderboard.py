"""
Leaderboard API endpoints.
"""
from typing import List
from enum import Enum

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict

from app.db import get_db
from app.models import Leaderboard, User

router = APIRouter(prefix="/api/v1/leaderboard", tags=["leaderboard"])


class PeriodFilter(str, Enum):
    """Time period filter for leaderboard."""
    ALL = "all"
    # Future: Add DAILY, WEEKLY, MONTHLY


class LeaderboardEntry(BaseModel):
    """Leaderboard entry response model."""
    model_config = ConfigDict(from_attributes=True)

    rank: int
    user_id: str
    username: str
    best_score: int
    games_played: int
    avg_score: float
    total_score: int


@router.get("", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    period: PeriodFilter = Query(PeriodFilter.ALL, description="Time period for leaderboard"),
    limit: int = Query(10, ge=1, le=100, description="Number of top players to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get leaderboard rankings.

    Returns top players sorted by best_score in descending order.

    Args:
        period: Time period filter (currently only 'all' is supported)
        limit: Number of top players to return (default: 10, max: 100)
        db: Database session

    Returns:
        List[LeaderboardEntry]: Ranked list of top players
    """
    # Query leaderboard with user information
    query = (
        select(Leaderboard, User.username)
        .join(User, Leaderboard.user_id == User.id)
        .order_by(Leaderboard.best_score.desc())
        .limit(limit)
    )

    # Future: Add period filtering
    # if period == PeriodFilter.DAILY:
    #     query = query.where(Leaderboard.last_played >= datetime.now() - timedelta(days=1))
    # elif period == PeriodFilter.WEEKLY:
    #     query = query.where(Leaderboard.last_played >= datetime.now() - timedelta(days=7))

    result = await db.execute(query)
    rows = result.all()

    # Build response with rankings
    leaderboard_entries = []
    for rank, (leaderboard_entry, username) in enumerate(rows, start=1):
        leaderboard_entries.append(
            LeaderboardEntry(
                rank=rank,
                user_id=str(leaderboard_entry.user_id),
                username=username,
                best_score=leaderboard_entry.best_score,
                games_played=leaderboard_entry.games_played,
                avg_score=leaderboard_entry.avg_score,
                total_score=leaderboard_entry.total_score
            )
        )

    return leaderboard_entries
