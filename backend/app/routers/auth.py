from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.audit import AuditEvent
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates analyst or administrator and returns JWT access token."""
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated"
        )

    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})

    # Log audit event
    audit = AuditEvent(
        action_type="USER_LOGIN",
        actor_username=user.username,
        entity_type="user",
        entity_id=str(user.id),
        details=f"Successful login by {user.username} with role {user.role}",
        created_at=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role
    )

@router.get("/me", response_model=UserResponse)
def get_current_profile(current_user: User = Depends(get_current_user)):
    """Returns details of the currently authenticated session user."""
    return current_user
