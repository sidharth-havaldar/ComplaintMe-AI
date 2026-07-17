"""API v1 router.

Feature routers (auth, complaints, dashboard, admin, analysis) are
registered here as they are built in later sprints.
"""

from fastapi import APIRouter

from app.api.v1 import complaints, copilot, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(complaints.router)
api_router.include_router(copilot.router)
