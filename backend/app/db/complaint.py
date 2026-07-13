"""Complaint Engine ORM models (CMP-001).

Implements the normalized core of the Complaint Engine, separating
user-submitted complaints from AI-generated intelligence per DATABASE.md.

`user_id`, `organization_id` and `updated_by` reference entities that live
outside this migration (users/organizations), so they are stored as plain
indexed UUID columns without database-level foreign keys. Foreign keys are
defined only between the tables created here.
"""

import uuid

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Complaint(Base):
    """A complaint submitted by a user (source of truth / facts)."""

    __tablename__ = "complaints"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True, index=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    current_status: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default="pending", index=True
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    ai_analyses: Mapped[list["ComplaintAIAnalysis"]] = relationship(
        back_populates="complaint", cascade="all, delete-orphan"
    )
    attachments: Mapped[list["Attachment"]] = relationship(
        back_populates="complaint", cascade="all, delete-orphan"
    )
    status_history: Mapped[list["ComplaintStatusHistory"]] = relationship(
        back_populates="complaint", cascade="all, delete-orphan"
    )


class ComplaintAIAnalysis(Base):
    """An AI-generated analysis of a complaint (interpretation).

    A complaint may have many analyses; none are ever overwritten.
    """

    __tablename__ = "complaint_ai_analysis"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ai_provider: Mapped[str] = mapped_column(String(100), nullable=False)
    ai_model: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product: Mapped[str | None] = mapped_column(String(255), nullable=True)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sentiment: Mapped[str | None] = mapped_column(String(50), nullable=True)
    emotion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    severity: Mapped[str | None] = mapped_column(String(50), nullable=True)
    priority: Mapped[str | None] = mapped_column(String(50), nullable=True)
    expected_outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    actual_outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    processing_time: Mapped[int | None] = mapped_column(Integer, nullable=True)
    prompt_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    complaint: Mapped["Complaint"] = relationship(back_populates="ai_analyses")


class Attachment(Base):
    """A file uploaded against a complaint."""

    __tablename__ = "attachments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    uploaded_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    complaint: Mapped["Complaint"] = relationship(back_populates="attachments")


class ComplaintStatusHistory(Base):
    """An audit record of a complaint status transition."""

    __tablename__ = "complaint_status_history"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True
    )
    old_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True, index=True)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    complaint: Mapped["Complaint"] = relationship(back_populates="status_history")
