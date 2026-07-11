"""Declarative base for all ORM models.

Models (added in later sprints) must inherit from `Base` and be imported
in `app.db.models` so Alembic autogenerate can discover them.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
