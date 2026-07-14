"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import get_logger, setup_logging

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Starting %s v%s (%s)",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.ENVIRONMENT,
    )
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Catch otherwise-unhandled errors and return a JSON 500. This is defined BEFORE
# the CORS middleware is added so that CORSMiddleware ends up wrapping it (the
# most recently added middleware is outermost). Starlette's built-in 500 path
# runs in ServerErrorMiddleware, which sits *outside* CORSMiddleware, so bare
# server errors would otherwise reach the browser with no Access-Control-* headers
# and be misreported as a CORS failure. Handling the error here means the response
# flows back out through CORSMiddleware and carries proper CORS headers on failure.
@app.middleware("http")
async def catch_unhandled_errors(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error processing %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


# CORS. Origins come from settings.CORS_ORIGINS (comma-separated, env-driven) so
# deployments can widen the allowlist without code changes. We never use "*":
# credentials must stay enabled for Supabase Bearer tokens, and the CORS spec
# forbids wildcard origins together with credentials. Added last so it is the
# outermost app middleware and can attach headers to every response, errors included.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
