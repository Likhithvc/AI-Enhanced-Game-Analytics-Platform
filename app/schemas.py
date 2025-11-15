"""
Pydantic schemas for API request/response validation.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


# User Schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    display_name: Optional[str] = Field(None, max_length=100)


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None


# Session Schemas
class SessionStart(BaseModel):
    user_id: UUID
    device_info: Optional[dict] = Field(default_factory=dict)
    platform: Optional[str] = Field(None, max_length=50)
    game_version: Optional[str] = Field(None, max_length=50)
    meta: Optional[dict] = Field(default_factory=dict)


class SessionEnd(BaseModel):
    session_id: UUID
    end_time: Optional[datetime] = None
    final_score: Optional[int] = None
    meta: Optional[dict] = Field(default_factory=dict)


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    session_start: datetime
    session_end: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    game_version: Optional[str] = None
    platform: Optional[str] = None
    device_info: Optional[dict] = None
    meta: Optional[dict] = None
    created_at: datetime
    updated_at: datetime


class SessionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    session_start: datetime
    session_end: datetime
    duration_seconds: int
    game_version: Optional[str] = None
    platform: Optional[str] = None
    final_score: Optional[int] = None
    event_count: int = 0
    meta: Optional[dict] = None


# Event Schemas
class EventCreate(BaseModel):
    user_id: UUID
    session_id: Optional[UUID] = None
    event_type: str = Field(..., min_length=1, max_length=100)
    event_name: str = Field(..., min_length=1, max_length=255)
    event_category: Optional[str] = Field(None, max_length=100)
    payload: dict = Field(default_factory=dict)
    timestamp: Optional[datetime] = None


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    session_id: Optional[UUID] = None
    event_type: str
    event_name: str
    event_category: Optional[str] = None
    payload: dict
    timestamp: datetime
    created_at: datetime


# Generic Response Schemas
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None


class SuccessResponse(BaseModel):
    message: str
    data: Optional[dict] = None
