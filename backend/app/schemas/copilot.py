"""Pydantic request/response schemas for the Consumer Copilot API (COP-002)."""

from pydantic import BaseModel, Field


class DraftRequest(BaseModel):
    """The user's natural story — "tell us what happened"."""

    story: str = Field(min_length=1, max_length=10_000)


class DraftResponse(BaseModel):
    """A professional complaint draft for the user to review, edit and submit.

    Every fact is drawn from the user's own story; missing information appears
    as explicit placeholders, never as guesses (see ``app.copilot.base``).
    """

    subject: str
    recipient: str
    summary: str
    timeline: list[str] = Field(default_factory=list)
    body: str
    requested_resolution: str
    provider: str
    model: str
