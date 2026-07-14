"""Cortexa provider selection.

The single seam where a concrete provider is chosen. Everything else depends on
the :class:`~app.ai.base.CortexaProvider` contract, so adding a future provider
(e.g. a hosted LLM) means registering it here and flipping ``CORTEXA_PROVIDER`` —
no changes to the service, API or database.
"""

from __future__ import annotations

from collections.abc import Callable

from app.ai.base import CortexaProvider
from app.ai.heuristic import HeuristicCortexaProvider
from app.core.config import settings

# Registry of available providers, keyed by the CORTEXA_PROVIDER setting value.
_PROVIDERS: dict[str, Callable[[], CortexaProvider]] = {
    "heuristic": HeuristicCortexaProvider,
}


def get_cortexa_provider() -> CortexaProvider:
    """Return the configured Cortexa provider instance."""
    key = settings.CORTEXA_PROVIDER.lower()
    factory = _PROVIDERS.get(key)
    if factory is None:
        raise ValueError(
            f"Unknown CORTEXA_PROVIDER {settings.CORTEXA_PROVIDER!r}; "
            f"available: {sorted(_PROVIDERS)}"
        )
    return factory()
