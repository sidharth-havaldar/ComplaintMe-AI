"""Pydantic request/response schemas for the Complaint API."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ComplaintCreate(BaseModel):
    """Payload for creating a complaint."""

    description: str = Field(min_length=1)
    title: str | None = Field(default=None, max_length=255)


class ComplaintUpdate(BaseModel):
    """Partial payload for updating a complaint. All fields optional."""

    description: str | None = Field(default=None, min_length=1)
    title: str | None = Field(default=None, max_length=255)
    current_status: str | None = Field(default=None, max_length=50)


class ComplaintResponse(BaseModel):
    """Complaint representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    organization_id: uuid.UUID | None
    title: str | None
    description: str
    current_status: str
    created_at: datetime
    updated_at: datetime
