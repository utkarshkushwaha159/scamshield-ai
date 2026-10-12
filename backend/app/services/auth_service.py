import hashlib
import os
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.firebase_service import verify_firebase_id_token

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Secure SHA-256 PBKDF2 password hashing with random salt."""
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}:{key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored salt:hash."""
    if not hashed_password or ":" not in hashed_password:
        return False
    try:
        salt, key_hex = hashed_password.split(":")
        test_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return test_key.hex() == key_hex
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        return None

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Returns current user if token provided, otherwise None (for voluntary anonymous submissions)."""
    if not credentials or not credentials.credentials:
        return None
    token = credentials.credentials

    # 1. Check internal JWT token (fast local verification)
    payload = decode_token(token)
    if payload and "sub" in payload:
        username = payload["sub"]
        return db.query(User).filter(User.username == username, User.is_active == True).first()

    # 2. Check if token is a direct Firebase ID Token
    fb_claims = verify_firebase_id_token(token)
    if fb_claims:
        uid = fb_claims.get("uid")
        email = fb_claims.get("email", f"{uid}@firebase.user")
        name = fb_claims.get("name", "Firebase User")
        user = db.query(User).filter(User.firebase_uid == uid).first()
        if not user:
            # Provision new Firebase user with default USER role
            user = User(
                username=email.split("@")[0],
                email=email,
                firebase_uid=uid,
                full_name=name,
                role="USER",
                is_active=True,
                preferred_language="en"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    return None

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    user = get_current_user_optional(credentials, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_analyst(user: User = Depends(get_current_user)) -> User:
    normalized_role = user.role.upper()
    if normalized_role not in ["ANALYST", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analyst privileges required for this action"
        )
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required for this action"
        )
    return user
