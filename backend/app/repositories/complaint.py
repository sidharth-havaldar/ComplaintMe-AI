"""SQLAlchemy data access for complaints (repository layer)."""

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.complaint import Complaint


class ComplaintRepository:
    """Encapsulates all persistence operations for complaints.

    Methods stage changes on the session (add / attribute mutation) and flush;
    transaction control (commit) is owned by the service layer.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, *, user_id: uuid.UUID, title: str | None, description: str) -> Complaint:
        complaint = Complaint(user_id=user_id, title=title, description=description)
        self._session.add(complaint)
        await self._session.flush()
        return complaint

    async def get_active(self, complaint_id: uuid.UUID) -> Complaint | None:
        """Return a non-deleted complaint by id, or None."""
        stmt = select(Complaint).where(
            Complaint.id == complaint_id,
            Complaint.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_active(self) -> Sequence[Complaint]:
        """Return all non-deleted complaints, newest first."""
        stmt = (
            select(Complaint)
            .where(Complaint.deleted_at.is_(None))
            .order_by(Complaint.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def soft_delete(self, complaint: Complaint) -> None:
        """Mark a complaint deleted without removing the row."""
        complaint.deleted_at = datetime.now(UTC)
        await self._session.flush()
