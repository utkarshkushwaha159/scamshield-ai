from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.audit import AuditEvent
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import verify_password, create_access_token, get_current_user
from app.services.firebase_service import verify_firebase_id_token, is_firebase_configured

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

@router.post("/firebase-login", response_model=TokenResponse)
def firebase_login(payload: dict, db: Session = Depends(get_db)):
    """
    Exchanges a Firebase ID token for a ScamShield JWT access token.
    Auto-provisions new Google Sign-In users with the default USER role.
    Returns 503 if Firebase is not configured on this server.
    """
    if not is_firebase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Firebase authentication is not configured on this server. "
                "Please configure FIREBASE_PROJECT_ID and FIREBASE_CREDENTIALS_PATH "
                "in backend/.env, or use the verified local credentials (analyst/admin)."
            )
        )

    id_token = payload.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="id_token is required.")

    claims = verify_firebase_id_token(id_token)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token is invalid or expired."
        )

    uid = claims.get("uid")
    email = claims.get("email", f"{uid}@firebase.user")
    name = claims.get("name", email.split("@")[0])

    user = db.query(User).filter(User.firebase_uid == uid).first()
    if not user:
        # Check if email already exists (linking local and Firebase accounts)
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.firebase_uid = uid
        else:
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

    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})

    audit = AuditEvent(
        action_type="FIREBASE_LOGIN",
        actor_username=user.username,
        entity_type="user",
        entity_id=str(user.id),
        details=f"Firebase Google Sign-In for {email} (uid={uid})",
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
