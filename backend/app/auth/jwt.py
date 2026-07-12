"""Supabase JWT verification.

Verification logic is intentionally not implemented in AUTH-001.
This module defines the structure and contract only.
"""

from typing import Any

from app.core.config import settings  # noqa: F401  (used once verification is implemented)


def verify_supabase_jwt(token: str) -> dict[str, Any]:
    """Verify a Supabase-issued JWT and return its decoded claims.

    Contract (to be implemented in AUTH-002):
    - Validate signature using ``settings.SUPABASE_JWT_SECRET``.
    - Validate expiry (``exp``) and audience (``aud`` == "authenticated").
    - Return the decoded claims, including ``sub`` (the Supabase user id).
    - Raise an authentication error for invalid, expired, or malformed tokens.
    """
    raise NotImplementedError("JWT verification is implemented in AUTH-002.")
