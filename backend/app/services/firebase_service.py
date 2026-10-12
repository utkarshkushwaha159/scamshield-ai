import os
import json
import time
import logging
import urllib.request
from typing import Optional, Dict, Any
import jwt
from cryptography.x509 import load_pem_x509_certificate

logger = logging.getLogger("scamshield.firebase")

PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID") or "scamshield-ai-2a639"
FIREBASE_INITIALIZED = False
firebase_auth = None

try:
    import firebase_admin
    from firebase_admin import credentials, auth as _firebase_auth
    firebase_auth = _firebase_auth

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if not firebase_admin._apps:
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            FIREBASE_INITIALIZED = True
            logger.info("Firebase Admin SDK successfully initialized from credentials file.")
        elif PROJECT_ID:
            firebase_admin.initialize_app(options={"projectId": PROJECT_ID})
            FIREBASE_INITIALIZED = True
            logger.info(f"Firebase Admin SDK initialized with project ID '{PROJECT_ID}'.")
        else:
            logger.info("Firebase credentials not configured. Operating in modular fallback dev mode.")
    else:
        FIREBASE_INITIALIZED = True
except Exception as e:
    logger.warning(f"Firebase Admin SDK initialization skipped or failed: {e}")

# In-memory cache for Google public x509 certificates
_CERT_CACHE: Dict[str, str] = {}
_CERT_CACHE_EXPIRY: float = 0.0

def _get_google_public_certs() -> Dict[str, str]:
    global _CERT_CACHE, _CERT_CACHE_EXPIRY
    now = time.time()
    if _CERT_CACHE and now < _CERT_CACHE_EXPIRY:
        return _CERT_CACHE
    try:
        url = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
        req = urllib.request.Request(url, headers={"User-Agent": "ScamShield-Auth/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            cache_control = resp.headers.get("Cache-Control", "")
            max_age = 3600
            for part in cache_control.split(","):
                part = part.strip()
                if part.startswith("max-age="):
                    try:
                        max_age = int(part.split("=")[1])
                    except ValueError:
                        pass
            _CERT_CACHE = json.loads(resp.read().decode("utf-8"))
            _CERT_CACHE_EXPIRY = now + max_age
            return _CERT_CACHE
    except Exception as e:
        logger.error(f"Failed to fetch Google public certificates: {e}")
        return _CERT_CACHE

def verify_with_google_public_keys(token: str, project_id: str) -> Optional[Dict[str, Any]]:
    """
    Verifies Firebase ID token using Google public x509 certs (OIDC standard verification).
    Used when Firebase Admin SDK service account key is not present on cloud/serverless hosts.
    """
    try:
        unverified_headers = jwt.get_unverified_header(token)
        kid = unverified_headers.get("kid")
        alg = unverified_headers.get("alg")
        if alg != "RS256" or not kid:
            return None

        certs = _get_google_public_certs()
        if not certs or kid not in certs:
            return None

        cert_pem = certs[kid]
        cert = load_pem_x509_certificate(cert_pem.encode("utf-8"))
        public_key = cert.public_key()

        decoded = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=project_id,
            issuer=f"https://securetoken.google.com/{project_id}",
            options={
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True,
            }
        )
        if not decoded.get("sub"):
            return None
        decoded["uid"] = decoded["sub"]
        return decoded
    except Exception as e:
        logger.warning(f"Google public key verification failed: {e}")
        return None

def verify_firebase_id_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Firebase ID token.
    1. Tries Firebase Admin SDK if initialized with credentials.
    2. Falls back to direct Google public key verification (RFC 7519 / OIDC standard).
    """
    project_id = PROJECT_ID

    # 1. Try Firebase Admin SDK
    if firebase_auth and FIREBASE_INITIALIZED:
        try:
            return firebase_auth.verify_id_token(token)
        except Exception as e:
            logger.debug(f"Firebase Admin SDK verification failed, falling back to public certs: {e}")

    # 2. Fallback to direct verification with Google's public keys
    if project_id:
        return verify_with_google_public_keys(token, project_id)

    return None

def is_firebase_configured() -> bool:
    return bool(FIREBASE_INITIALIZED or PROJECT_ID)
