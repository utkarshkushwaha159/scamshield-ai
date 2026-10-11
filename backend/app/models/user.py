from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for Google / Firebase users
    firebase_uid = Column(String(128), unique=True, index=True, nullable=True)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="USER", nullable=False)  # "USER", "ANALYST", "ADMIN"
    preferred_language = Column(String(10), default="en", nullable=False)  # "en", "hi", "bn", etc.
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
