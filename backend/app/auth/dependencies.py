"""FastAPI authentication dependencies.

Placeholders only — no route uses these yet, and verification logic
arrives in AUTH-002.
"""

from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict[str, Any]:
    """Resolve the authenticated user from a Bearer token.

    Once AUTH-002 lands, this will delegate to
    ``app.auth.jwt.verify_supabase_jwt`` and return the user's claims.
    Until then, any route depending on it responds 501.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Authentication is not implemented yet (AUTH-002).",
    )


CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
