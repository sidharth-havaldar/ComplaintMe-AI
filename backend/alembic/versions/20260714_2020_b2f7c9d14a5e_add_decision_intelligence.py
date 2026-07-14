"""add decision intelligence to complaint_ai_analysis

Revision ID: b2f7c9d14a5e
Revises: 942150e09fea
Create Date: 2026-07-14 20:20:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'b2f7c9d14a5e'
down_revision: str | None = '942150e09fea'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Additive, nullable column for AI-002 decision intelligence. Existing rows
    # keep NULL; no data migration or redesign required.
    op.add_column(
        "complaint_ai_analysis",
        sa.Column("decision_intelligence", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("complaint_ai_analysis", "decision_intelligence")
