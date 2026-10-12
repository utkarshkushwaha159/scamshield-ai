import sys
import os
from pathlib import Path
from fastapi import Request

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Configure for serverless environment: writable SQLite database in /tmp
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/scamshield.db")
os.environ.setdefault("ENVIRONMENT", "production")
os.environ.setdefault("JWT_SECRET_KEY", "scamshield-raksham-ps02-secret-2026-iit-delhi")

from app.main import app

@app.middleware("http")
async def vercel_path_fix(request: Request, call_next):
    # Retrieve original path forwarded via Vercel rewrite
    orig_path = request.query_params.get("__orig_path")
    if orig_path:
        request.scope["path"] = orig_path
    elif request.headers.get("x-matched-path"):
        request.scope["path"] = request.headers.get("x-matched-path")
    return await call_next(request)
