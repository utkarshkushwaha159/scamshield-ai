from app.routers.health import router as health_router
from app.routers.submission import router as submission_router
from app.routers.cases import router as cases_router
from app.routers.graph import router as graph_router
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router

__all__ = [
    "health_router",
    "submission_router",
    "cases_router",
    "graph_router",
    "auth_router",
    "admin_router",
]
