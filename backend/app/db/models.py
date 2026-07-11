"""Model registry for Alembic autogenerate.

Import every ORM model module here. Sprint 1.1 ships no models;
tables arrive in later sprints per DATABASE.md.
"""

from app.db.base import Base

__all__ = ["Base"]
