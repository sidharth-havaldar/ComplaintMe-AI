"""Model registry for Alembic autogenerate.

Import every ORM model module here so Alembic can discover their tables
via `Base.metadata`.
"""

from app.db.base import Base
from app.db.complaint import (
    Attachment,
    Complaint,
    ComplaintAIAnalysis,
    ComplaintStatusHistory,
)

__all__ = [
    "Base",
    "Complaint",
    "ComplaintAIAnalysis",
    "Attachment",
    "ComplaintStatusHistory",
]
