from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import *  # Ensure all models are registered with Base
from app.services.seed_service import seed_database
from app.routers import (
    health_router,
    submission_router,
    cases_router,
    graph_router,
    auth_router,
    admin_router,
    websocket_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Seed default demonstration cases and users if empty
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Explainable Financial Scam Pattern Recognition & Workflow Intelligence Platform for UPI, Banking, and Digital Wallets.",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler to avoid leaking raw traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error occurred",
            "detail": "An unexpected error occurred during processing. Please contact system support.",
            "type": exc.__class__.__name__
        }
    )

# Include Routers
app.include_router(health_router)
app.include_router(submission_router)
app.include_router(cases_router)
app.include_router(graph_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(websocket_router)


@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "health_url": "/api/health"
    }
