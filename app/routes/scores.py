"""
Score submission and leaderboard routes.
"""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import User
from app.jwt import get_current_user

router = APIRouter(prefix="/scores", tags=["scores"])


# Pydantic Schemas
class ScoreSubmit(BaseModel):
    """Schema for score submission."""
    score: int = Field(..., ge=0, description="Score must be non-negative")


class ScoreResponse(BaseModel):
    """Response after score submission."""
    highest_score: int
    new_record: bool


class LeaderboardEntry(BaseModel):
    """Leaderboard entry with username and score."""
    username: str
    highest_score: int

    class Config:
        from_attributes = True


@router.post("/submit", response_model=ScoreResponse)
async def submit_score(
    score_data: ScoreSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a game score.
    
    - Requires JWT authentication
    - Updates user's highest score if new score is greater
    - Returns current highest score and whether it's a new record
    """
    new_record = False
    
    # Check if this is a new high score
    if score_data.score > current_user.highest_score:
        current_user.highest_score = score_data.score
        new_record = True
        
        # Commit the update to database
        await db.commit()
        await db.refresh(current_user)
    
    return ScoreResponse(
        highest_score=current_user.highest_score,
        new_record=new_record
    )


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    limit: int = Query(default=10, ge=1, le=100, description="Number of top players to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the top players leaderboard.
    
    - No authentication required
    - Returns top players ordered by highest score (descending)
    - Configurable limit (default 10, max 100)
    """
    # Query top users by highest_score in descending order
    result = await db.execute(
        select(User)
        .order_by(User.highest_score.desc())
        .limit(limit)
    )
    top_users = result.scalars().all()
    
    return [
        LeaderboardEntry(username=user.username, highest_score=user.highest_score)
        for user in top_users
    ]
