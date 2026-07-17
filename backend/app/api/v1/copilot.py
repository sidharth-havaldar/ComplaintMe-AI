"""Consumer Copilot endpoints (COP-002).

Drafting is stateless: nothing is stored until the user reviews the draft and
submits it through the existing complaint CRUD (``POST /complaints``), at
which point Cortexa analyzes the stored complaint as usual.
"""

from dataclasses import asdict

from fastapi import APIRouter

from app.api.deps import CopilotServiceDep, CurrentUserId
from app.schemas.copilot import DraftRequest, DraftResponse

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.post("/draft", response_model=DraftResponse)
async def draft_complaint(
    payload: DraftRequest,
    service: CopilotServiceDep,
    _user_id: CurrentUserId,
) -> DraftResponse:
    """Turn the user's natural story into a professional complaint draft."""
    draft = await service.draft(payload.story)
    return DraftResponse(**asdict(draft))
