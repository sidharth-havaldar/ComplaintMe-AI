"""Business logic for complaints (service layer)."""

import uuid
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.complaint import Complaint
from app.repositories.complaint import ComplaintRepository
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate


class ComplaintService:
    """Coordinates complaint use cases and owns transaction boundaries."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repository = ComplaintRepository(session)

    async def create(self, *, user_id: uuid.UUID, payload: ComplaintCreate) -> Complaint:
        complaint = await self._repository.create(
            user_id=user_id,
            title=payload.title,
            description=payload.description,
        )
        await self._session.commit()
        await self._session.refresh(complaint)
        return complaint

    async def get(self, complaint_id: uuid.UUID) -> Complaint | None:
        return await self._repository.get_active(complaint_id)

    async def list(self) -> Sequence[Complaint]:
        return await self._repository.list_active()

    async def update(
        self, complaint_id: uuid.UUID, payload: ComplaintUpdate
    ) -> Complaint | None:
        complaint = await self._repository.get_active(complaint_id)
        if complaint is None:
            return None

        updates = payload.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(complaint, field, value)

        await self._session.commit()
        await self._session.refresh(complaint)
        return complaint

    async def delete(self, complaint_id: uuid.UUID) -> bool:
        complaint = await self._repository.get_active(complaint_id)
        if complaint is None:
            return False

        await self._repository.soft_delete(complaint)
        await self._session.commit()
        return True
