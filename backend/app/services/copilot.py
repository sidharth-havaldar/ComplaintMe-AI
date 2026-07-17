"""Consumer Copilot orchestration (service layer) — COP-002.

Owns the "story in -> professional draft out" step of the consumer flow. The
provider is injected (defaulting to the configured one), keeping this layer
independent of any concrete drafting engine — the service never contains
drafting logic, only orchestration.

Deliberately stateless and separate from Cortexa: Copilot prepares complaints
before submission; nothing is persisted here. The reviewed/edited draft is
submitted through the existing Complaint CRUD, where Cortexa analyzes it.
"""

from app.copilot.base import ComplaintDraft, CopilotProvider
from app.copilot.factory import get_copilot_provider


class CopilotService:
    """Coordinates complaint drafting for the Consumer Copilot."""

    def __init__(self, provider: CopilotProvider | None = None) -> None:
        self._provider = provider or get_copilot_provider()

    async def draft(self, story: str) -> ComplaintDraft:
        """Produce a professional complaint draft from the user's story."""
        return await self._provider.draft(story)
