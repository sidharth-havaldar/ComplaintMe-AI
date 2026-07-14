"""Cortexa orchestration (service layer).

Owns the "Cortexa analyzes -> store intelligence" step of the pipeline: run the
configured provider to extract a structured analysis (AI-001) and derive decision
intelligence (AI-002), then persist both into the existing
``complaint_ai_analysis`` table. The provider is injected (defaulting to the
configured one), keeping this layer independent of any concrete engine — the
service never contains provider logic, only orchestration.
"""

import uuid
from dataclasses import asdict
from time import perf_counter

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import CortexaDecision, CortexaIntelligence, CortexaProvider
from app.ai.factory import get_cortexa_provider
from app.core.logging import get_logger
from app.db.complaint import ComplaintAIAnalysis
from app.db.session import AsyncSessionLocal
from app.repositories.ai_analysis import AIAnalysisRepository
from app.repositories.complaint import ComplaintRepository

logger = get_logger(__name__)


def _serialize_decision(decision: CortexaDecision) -> dict:
    """Flatten a CortexaDecision (incl. nested department) into a JSON payload."""
    return asdict(decision)


def _serialize_intelligence(intelligence: CortexaIntelligence) -> dict:
    """Flatten CortexaIntelligence into a JSON payload."""
    return asdict(intelligence)


class CortexaService:
    """Coordinates complaint intelligence and persists the structured result."""

    def __init__(self, session: AsyncSession, provider: CortexaProvider | None = None) -> None:
        self._session = session
        self._provider = provider or get_cortexa_provider()
        self._complaints = ComplaintRepository(session)
        self._analyses = AIAnalysisRepository(session)

    async def analyze_complaint(self, complaint_id: uuid.UUID) -> ComplaintAIAnalysis | None:
        """Analyze a complaint and store the result. Returns None if it is gone."""
        complaint = await self._complaints.get_active(complaint_id)
        if complaint is None:
            return None

        text = (
            f"{complaint.title}\n{complaint.description}"
            if complaint.title
            else complaint.description
        )

        started = perf_counter()
        result = await self._provider.analyze(text)
        # AI-002: turn extraction into decision intelligence via the same provider.
        decision = await self._provider.decide(text, result)
        # AI-003: turn this complaint + history into cross-complaint intelligence.
        # The service supplies the candidate history (data access); the provider
        # does the scoring (logic), keeping the two concerns cleanly separated.
        history = await self._analyses.list_history_signals(exclude_complaint_id=complaint_id)
        intelligence = await self._provider.intelligence(
            text, result, decision, history, complaint.created_at
        )
        elapsed_ms = int((perf_counter() - started) * 1000)

        analysis = await self._analyses.create(
            complaint_id=complaint_id,
            provider=self._provider.name,
            model=self._provider.model,
            prompt_version=self._provider.prompt_version,
            processing_time=elapsed_ms,
            analysis=result,
            decision_intelligence=_serialize_decision(decision),
            complaint_intelligence=_serialize_intelligence(intelligence),
        )
        await self._session.commit()
        await self._session.refresh(analysis)
        return analysis


async def analyze_complaint_task(complaint_id: uuid.UUID) -> None:
    """Background entrypoint: analyze a complaint on its own DB session.

    Runs after the create response is sent (FastAPI BackgroundTasks), so the API
    never blocks on analysis. Failures are logged, not raised — a missing analysis
    simply leaves the detail page in its "analyzing" state.
    """
    async with AsyncSessionLocal() as session:
        try:
            await CortexaService(session).analyze_complaint(complaint_id)
        except Exception:
            logger.exception("Cortexa analysis failed for complaint %s", complaint_id)
