import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Configure for serverless environment: writable SQLite database in /tmp
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/scamshield.db")
os.environ.setdefault("ENVIRONMENT", "production")

from app.main import app
