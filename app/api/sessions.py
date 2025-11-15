"""
Session management API endpoints.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.db import get_db
from app.models import Session, Event, Leaderboard
from app.schemas import SessionStart, SessionEnd, SessionResponse, SessionSummary

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


@router.post("/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    session_data: SessionStart,
    db: AsyncSession = Depends(get_db)
):
    """
    Start a new game session.
    
    Args:
        session_data: Session start information including user_id and device_info
        db: Database session
        
    Returns:
        SessionResponse: Created session with session_id
        
    Raises:
        HTTPException: If user not found or database error
    """
    # Create new session
    new_session = Session(
        user_id=session_data.user_id,
        device_info=session_data.device_info,
        platform=session_data.platform,
        game_version=session_data.game_version,
        meta=session_data.meta,
        session_start=datetime.utcnow()
    )
    
    db.add(new_session)
    
    try:
        await db.commit()
        await db.refresh(new_session)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create session. User may not exist. Error: {str(e)}"
        )
    
    return new_session


@router.post("/end", response_model=SessionSummary)
async def end_session(
    session_end_data: SessionEnd,
    db: AsyncSession = Depends(get_db)
):
    """
    End an existing game session.
    
    Args:
        session_end_data: Session end information including session_id and end_time
        db: Database session
        
    Returns:
        SessionSummary: Updated session with summary information
        
    Raises:
        HTTPException: 404 if session not found
    """
    # Find the session
    result = await db.execute(
        select(Session).where(Session.id == session_end_data.session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with id {session_end_data.session_id} not found"
        )
    
    # Check if session already ended
    if session.session_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session {session_end_data.session_id} has already ended"
        )
    
    # Update session
    end_time = session_end_data.end_time or datetime.utcnow()
    session.session_end = end_time
    
    # Calculate duration in seconds
    duration = (end_time - session.session_start).total_seconds()
    session.duration_seconds = int(duration)
    
    # Update metadata with final score if provided
    if session_end_data.final_score is not None:
        session.meta = session.meta or {}
        session.meta["final_score"] = session_end_data.final_score
    
    # Merge additional metadata
    if session_end_data.meta:
        session.meta = session.meta or {}
        session.meta.update(session_end_data.meta)
    
    # Get event count for this session
    event_count_result = await db.execute(
        select(func.count(Event.id)).where(Event.session_id == session.id)
    )
    event_count = event_count_result.scalar() or 0
    
    # Update leaderboard with session score (on-write aggregation)
    final_score = session_end_data.final_score or 0
    if final_score > 0:
        await _update_leaderboard(db, session.user_id, final_score, end_time)
    
    try:
        await db.commit()
        await db.refresh(session)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update session: {str(e)}"
        )
    
    # Build summary response
    summary = SessionSummary(
        id=session.id,
        user_id=session.user_id,
        session_start=session.session_start,
        session_end=session.session_end,
        duration_seconds=session.duration_seconds,
        game_version=session.game_version,
        platform=session.platform,
        final_score=session.meta.get("final_score") if session.meta else None,
        event_count=event_count,
        meta=session.meta
    )
    
    return summary


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get session details by ID.
    
    Args:
        session_id: UUID of the session
        db: Database session
        
    Returns:
        SessionResponse: Session details
        
    Raises:
        HTTPException: 404 if session not found
    """
    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with id {session_id} not found"
        )
    
    return session


async def _update_leaderboard(
    db: AsyncSession,
    user_id: UUID,
    score: int,
    last_played: datetime
) -> None:
    """
    Update leaderboard statistics for a user using UPSERT logic.
    
    This is an on-write aggregation that updates leaderboard stats
    whenever a session ends with a score.
    
    Args:
        db: Database session
        user_id: UUID of the user
        score: Score from the completed session
        last_played: Timestamp of the last game played
    """
    # PostgreSQL UPSERT using INSERT ... ON CONFLICT
    stmt = insert(Leaderboard).values(
        user_id=user_id,
        best_score=score,
        games_played=1,
        total_score=score,
        avg_score=score,
        last_played=last_played
    )
    
    # On conflict, update the statistics
    stmt = stmt.on_conflict_do_update(
        index_elements=['user_id'],
        set_={
            'games_played': Leaderboard.games_played + 1,
            'total_score': Leaderboard.total_score + score,
            'avg_score': (Leaderboard.total_score + score) / (Leaderboard.games_played + 1),
            'best_score': func.greatest(Leaderboard.best_score, score),
            'last_played': last_played,
            'updated_at': func.now()
        }
    )
    
    await db.execute(stmt)
