"""add complaint intelligence to complaint_ai_analysis

Revision ID: c3a1e8b26d7f
Revises: b2f7c9d14a5e
Create Date: 2026-07-14 20:45:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'c3a1e8b26d7f'
down_revision: str | None = 'b2f7c9d14a5e'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Additive, nullable column for AI-003 complaint intelligence. Existing rows
    # keep NULL; no data migration or redesign required.
    op.add_column(
        "complaint_ai_analysis",
        sa.Column("complaint_intelligence", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("complaint_ai_analysis", "complaint_intelligence")
