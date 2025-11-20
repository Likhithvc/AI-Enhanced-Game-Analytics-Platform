"""
Pydantic schemas for authentication and user management.
"""
from uuid import UUID
from pydantic import BaseModel, Field


# User Schemas
class UserCreate(BaseModel):
    """Schema for user registration."""
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    """Schema for user login."""
    username: str
    password: str


class UserPublic(BaseModel):
    """Public user information (no sensitive data)."""
    id: UUID
    username: str
    highest_score: int

    class Config:
        from_attributes = True


# Token Schemas
class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""
    username: str | None = None


# JWT Settings and Constants
SECRET_KEY = "your-secret-key-change-this-in-production-use-openssl-rand-hex-32"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

