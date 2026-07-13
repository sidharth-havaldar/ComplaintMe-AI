"""Complaint CRUD endpoints (CMP-002).

Exposes the Complaint Engine over REST. Authentication is assumed; the
authenticated user's id is resolved via the ``CurrentUserId`` dependency.
"""

import uuid

from fastapi import APIRouter, HTTPException, status

from app.api.deps import ComplaintServiceDep, CurrentUserId
from app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintUpdate

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreate,
    service: ComplaintServiceDep,
    user_id: CurrentUserId,
) -> ComplaintResponse:
    """Create a complaint for the authenticated user."""
    complaint = await service.create(user_id=user_id, payload=payload)
    return ComplaintResponse.model_validate(complaint)


@router.get("", response_model=list[ComplaintResponse])
async def list_complaints(service: ComplaintServiceDep) -> list[ComplaintResponse]:
    """List all non-deleted complaints, newest first."""
    complaints = await service.list()
    return [ComplaintResponse.model_validate(c) for c in complaints]


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: uuid.UUID,
    service: ComplaintServiceDep,
) -> ComplaintResponse:
    """Retrieve a single non-deleted complaint by id."""
    complaint = await service.get(complaint_id)
    if complaint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    return ComplaintResponse.model_validate(complaint)


@router.patch("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: uuid.UUID,
    payload: ComplaintUpdate,
    service: ComplaintServiceDep,
) -> ComplaintResponse:
    """Partially update a non-deleted complaint."""
    complaint = await service.update(complaint_id, payload)
    if complaint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    return ComplaintResponse.model_validate(complaint)


@router.delete("/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_complaint(
    complaint_id: uuid.UUID,
    service: ComplaintServiceDep,
) -> None:
    """Soft-delete a complaint by populating ``deleted_at``."""
    deleted = await service.delete(complaint_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
