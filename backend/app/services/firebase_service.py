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
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    if not firebase_admin._apps:
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            FIREBASE_INITIALIZED = True
            logger.info("Firebase Admin SDK successfully initialized from credentials file.")
        elif project_id:
            firebase_admin.initialize_app(options={"projectId": project_id})
            FIREBASE_INITIALIZED = True
            logger.info(f"Firebase Admin SDK initialized with project ID '{project_id}'.")
        else:
            logger.info("Firebase credentials not configured. Operating in modular fallback dev mode.")
    else:
        FIREBASE_INITIALIZED = True
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
