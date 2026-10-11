import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("scamshield.firebase")

# Try to initialize Firebase Admin SDK if credentials provided
FIREBASE_INITIALIZED = False
try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        FIREBASE_INITIALIZED = True
        logger.info("Firebase Admin SDK successfully initialized from credentials file.")
    elif os.getenv("FIREBASE_PROJECT_ID"):
        # Application Default Credentials / Project initialization
        firebase_admin.initialize_app()
        FIREBASE_INITIALIZED = True
        logger.info("Firebase Admin SDK initialized using default credentials.")
    else:
        logger.info("Firebase credentials not configured. Operating in modular fallback dev mode.")
except Exception as e:
    logger.warning(f"Firebase Admin SDK initialization skipped or failed: {e}")

def verify_firebase_id_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Firebase ID token using Firebase Admin SDK when available.
    Returns decoded token dictionary or None if invalid.
    """
    if not FIREBASE_INITIALIZED:
        return None

    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Firebase ID token verification failed: {e}")
        return None

def is_firebase_configured() -> bool:
    return FIREBASE_INITIALIZED
