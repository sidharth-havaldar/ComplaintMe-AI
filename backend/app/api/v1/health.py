"""Health endpoints for liveness and readiness checks."""

from fastapi import APIRouter

from app.core.config import settings
from app.core.logging import get_logger
from app.db.session import check_database_connection
from app.schemas.health import HealthResponse, ReadinessResponse

logger = get_logger(__name__)

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness probe — process is up."""
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
    )


@router.get("/health/ready", response_model=ReadinessResponse)
async def readiness() -> ReadinessResponse:
    """Readiness probe — process is up and the database is reachable."""
    try:
        await check_database_connection()
        database = "connected"
    except Exception:
        logger.exception("Database readiness check failed")
        database = "unavailable"

    return ReadinessResponse(
        status="ok" if database == "connected" else "degraded",
        database=database,
    )
