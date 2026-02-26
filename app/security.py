"""
Security utilities for password hashing and verification.
"""
from passlib.context import CryptContext

# Use PBKDF2-SHA256 for password hashing
# This avoids binary bcrypt dependency issues while maintaining strong security
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """
    Hash a plain text password.

    Args:
        plain_password: The plain text password to hash

    Returns:
        The hashed password string
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.

    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to verify against

    Returns:
        True if the password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)
