"""implement complaint engine models

Revision ID: 942150e09fea
Revises:
Create Date: 2026-07-13 21:31:44.125434

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = '942150e09fea'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _timestamp(name: str) -> sa.Column:
    return sa.Column(
        name,
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    )


def upgrade() -> None:
    op.create_table(
        "complaints",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "current_status",
            sa.String(length=50),
            server_default="pending",
            nullable=False,
        ),
        _timestamp("created_at"),
        _timestamp("updated_at"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_complaints_user_id", "complaints", ["user_id"])
    op.create_index("ix_complaints_organization_id", "complaints", ["organization_id"])
    op.create_index("ix_complaints_current_status", "complaints", ["current_status"])
    op.create_index("ix_complaints_created_at", "complaints", ["created_at"])
    op.create_index("ix_complaints_deleted_at", "complaints", ["deleted_at"])

    op.create_table(
        "complaint_ai_analysis",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("complaint_id", sa.Uuid(), nullable=False),
        sa.Column("ai_provider", sa.String(length=100), nullable=False),
        sa.Column("ai_model", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("company", sa.String(length=255), nullable=True),
        sa.Column("product", sa.String(length=255), nullable=True),
        sa.Column("department", sa.String(length=255), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("sentiment", sa.String(length=50), nullable=True),
        sa.Column("emotion", sa.String(length=50), nullable=True),
        sa.Column("severity", sa.String(length=50), nullable=True),
        sa.Column("priority", sa.String(length=50), nullable=True),
        sa.Column("expected_outcome", sa.Text(), nullable=True),
        sa.Column("actual_outcome", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("language", sa.String(length=50), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("processing_time", sa.Integer(), nullable=True),
        sa.Column("prompt_version", sa.String(length=50), nullable=True),
        _timestamp("created_at"),
        sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_complaint_ai_analysis_complaint_id", "complaint_ai_analysis", ["complaint_id"]
    )
    op.create_index(
        "ix_complaint_ai_analysis_created_at", "complaint_ai_analysis", ["created_at"]
    )

    op.create_table(
        "attachments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("complaint_id", sa.Uuid(), nullable=False),
        sa.Column("file_url", sa.String(length=1024), nullable=False),
        sa.Column("file_type", sa.String(length=100), nullable=True),
        _timestamp("uploaded_at"),
        sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_attachments_complaint_id", "attachments", ["complaint_id"])

    op.create_table(
        "complaint_status_history",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("complaint_id", sa.Uuid(), nullable=False),
        sa.Column("old_status", sa.String(length=50), nullable=True),
        sa.Column("new_status", sa.String(length=50), nullable=False),
        sa.Column("updated_by", sa.Uuid(), nullable=True),
        _timestamp("updated_at"),
        sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_complaint_status_history_complaint_id", "complaint_status_history", ["complaint_id"]
    )
    op.create_index(
        "ix_complaint_status_history_updated_by", "complaint_status_history", ["updated_by"]
    )


def downgrade() -> None:
    op.drop_table("complaint_status_history")
    op.drop_table("attachments")
    op.drop_table("complaint_ai_analysis")
    op.drop_table("complaints")
