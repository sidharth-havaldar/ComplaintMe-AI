"""Shared FastAPI dependencies for API v1 (dependency injection)."""

import uuid
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.complaint import ComplaintService

# Stand-in for the authenticated user until AUTH-002 wires real Supabase JWT
# verification into ``app.auth``. The Complaint API assumes an authenticated
# user (CMP-002); this placeholder is the single seam to swap for the real
# ``get_current_user`` dependency without touching the routes or service.
PLACEHOLDER_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def get_current_user_id() -> uuid.UUID:
    """Resolve the authenticated user's id."""
    return PLACEHOLDER_USER_ID


def get_complaint_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ComplaintService:
    """Provide a ComplaintService bound to the request-scoped session."""
    return ComplaintService(session)


CurrentUserId = Annotated[uuid.UUID, Depends(get_current_user_id)]
ComplaintServiceDep = Annotated[ComplaintService, Depends(get_complaint_service)]
