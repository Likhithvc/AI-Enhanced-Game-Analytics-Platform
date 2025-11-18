"""
Event tracking API endpoints.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field


from app.db import get_db
from app.models import Event
from app.schemas import EventCreate, EventResponse

from app.auth import get_current_active_user
from app.metrics import inc_events

router = APIRouter(prefix="/api/v1/events", tags=["events"])


class BulkEventCreate(BaseModel):
    """Request model for bulk event creation."""
    events: List[EventCreate] = Field(..., min_length=1)


class EventValidationError(BaseModel):
    """Model for individual event validation errors."""
    index: int
    event: dict
    error: str


class BulkEventResponse(BaseModel):
    """Response model for bulk event creation."""
    inserted_count: int
    total_count: int
    validation_errors: List[EventValidationError] = Field(default_factory=list)
    inserted_event_ids: List[UUID] = Field(default_factory=list)


@router.post("", response_model=BulkEventResponse, status_code=status.HTTP_201_CREATED)
async def create_events(
    bulk_data: BulkEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    """
    Create multiple events in a single transaction (bulk insert).
    
    Args:
        bulk_data: Bulk event creation data containing array of events
        db: Database session
        
    Returns:
        BulkEventResponse: Summary with inserted count and validation errors
    """
    validation_errors = []
    valid_events = []
    
    # Validate and prepare events
    for index, event_data in enumerate(bulk_data.events):
        try:
            # Create Event model instance
            event = Event(
                user_id=event_data.user_id,
                session_id=event_data.session_id,
                event_type=event_data.event_type,
                event_name=event_data.event_name,
                event_category=event_data.event_category,
                payload=event_data.payload,
                timestamp=event_data.timestamp
            )
            valid_events.append(event)
        except Exception as e:
            validation_errors.append(
                EventValidationError(
                    index=index,
                    event=event_data.model_dump(),
                    error=str(e)
                )
            )
    
    # Bulk insert valid events in a single transaction
    inserted_event_ids = []
    if valid_events:
        try:
            db.add_all(valid_events)
            await db.commit()
            # Refresh to get generated IDs
            for event in valid_events:
                await db.refresh(event)
                inserted_event_ids.append(event.id)
            inc_events(len(valid_events))
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to insert events: {str(e)}"
            )
    
    return BulkEventResponse(
        inserted_count=len(valid_events),
        total_count=len(bulk_data.events),
        validation_errors=validation_errors,
        inserted_event_ids=inserted_event_ids
    )


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get event details by ID.
    
    Args:
        event_id: UUID of the event
        db: Database session
        
    Returns:
        EventResponse: Event details
        
    Raises:
        HTTPException: 404 if event not found
    """
    from sqlalchemy import select
    
    result = await db.execute(
        select(Event).where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found"
        )
    
    return event


@router.get("/session/{session_id}", response_model=List[EventResponse])
async def get_session_events(
    session_id: UUID,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all events for a specific session.
    
    Args:
        session_id: UUID of the session
        limit: Maximum number of events to return
        offset: Number of events to skip
        db: Database session
        
    Returns:
        List[EventResponse]: List of events for the session
    """
    from sqlalchemy import select
    
    result = await db.execute(
        select(Event)
        .where(Event.session_id == session_id)
        .order_by(Event.timestamp)
        .limit(limit)
        .offset(offset)
    )
    events = result.scalars().all()
    
    return events


@router.get("/user/{user_id}", response_model=List[EventResponse])
async def get_user_events(
    user_id: UUID,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all events for a specific user.
    
    Args:
        user_id: UUID of the user
        limit: Maximum number of events to return
        offset: Number of events to skip
        db: Database session
        
    Returns:
        List[EventResponse]: List of events for the user
    """
    from sqlalchemy import select
    
    result = await db.execute(
        select(Event)
        .where(Event.user_id == user_id)
        .order_by(Event.timestamp.desc())
        .limit(limit)
        .offset(offset)
    )
    events = result.scalars().all()
    
    return events
