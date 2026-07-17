"""Consumer Copilot provider selection.

The single seam where a concrete drafting provider is chosen — the exact
mirror of :mod:`app.ai.factory`. Everything else depends on the
:class:`~app.copilot.base.CopilotProvider` contract, so adding a future
provider (an LLM drafter, a multilingual drafter) means registering it here
and flipping ``COPILOT_PROVIDER`` — no changes to the service, API or frontend.
"""

from __future__ import annotations

from collections.abc import Callable

from app.copilot.base import CopilotProvider
from app.copilot.heuristic import HeuristicCopilotProvider
from app.core.config import settings

# Registry of available providers, keyed by the COPILOT_PROVIDER setting value.
_PROVIDERS: dict[str, Callable[[], CopilotProvider]] = {
    "heuristic": HeuristicCopilotProvider,
}


def get_copilot_provider() -> CopilotProvider:
    """Return the configured Consumer Copilot provider instance."""
    key = settings.COPILOT_PROVIDER.lower()
    factory = _PROVIDERS.get(key)
    if factory is None:
        raise ValueError(
            f"Unknown COPILOT_PROVIDER {settings.COPILOT_PROVIDER!r}; "
            f"available: {sorted(_PROVIDERS)}"
        )
    return factory()
