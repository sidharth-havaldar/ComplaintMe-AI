"""Consumer Copilot provider contract (COP-002).

Consumer Copilot turns a consumer's natural story ("my phone is bad, I am very
angry") into a professional complaint draft the user reviews, edits and then
submits. Providers are the swappable implementations of that job — a
deterministic drafter today, a hosted LLM tomorrow — selected at runtime by
:func:`app.copilot.factory.get_copilot_provider`, mirroring the Cortexa
provider architecture (``app.ai``).

Copilot is intentionally a *separate* pillar from Cortexa: Copilot prepares
complaints before submission; Cortexa analyzes them after. Neither imports the
other's provider.

Trust contract (applies to every provider, present and future):

- NEVER fabricate facts. A draft may improve grammar, structure, clarity and
  professionalism, but must never invent dates, invoices, warranty status,
  prices or events that are not in the user's story.
- If important information is missing, use placeholders (``[...]``) or neutral
  language rather than guessing.
- Trustworthiness over sounding impressive.

The contract is async and text-in / draft-out so future versions (follow-up
questions, voice transcripts, OCR'd documents, multilingual drafting, LLM
providers) slot in without changing the service, API or frontend.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass(slots=True)
class ComplaintDraft:
    """A professional complaint draft produced from a consumer's story.

    Every field is derived exclusively from the user's own words. ``body`` is
    the full professional complaint text; the remaining fields are the
    structured sections the review UI presents alongside it. ``timeline``
    entries are ordered, human-readable lines (empty when the story contains
    no time references — never invented).
    """

    subject: str
    recipient: str
    summary: str
    timeline: list[str] = field(default_factory=list)
    body: str = ""
    requested_resolution: str = ""
    # Provenance, persisted nowhere today but returned for transparency and
    # ready for future A/B comparison of drafting providers.
    provider: str = ""
    model: str = ""


class CopilotProvider(ABC):
    """A swappable complaint-drafting backend.

    Concrete providers declare a stable ``name`` / ``model`` (returned for
    provenance) and implement :meth:`draft`. The signature accepts only the
    raw story text; richer inputs (answers to follow-up questions, voice
    transcripts, OCR text, target language) arrive as future keyword-only
    parameters with defaults, so today's callers never change.
    """

    name: str
    model: str

    @abstractmethod
    async def draft(self, story: str) -> ComplaintDraft:
        """Transform a natural-language story into a professional complaint draft."""
        raise NotImplementedError
