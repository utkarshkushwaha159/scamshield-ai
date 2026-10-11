import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "ScamShield AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./scamshield.db")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "scamshield-super-secret-dev-key-change-in-prod-2026")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
