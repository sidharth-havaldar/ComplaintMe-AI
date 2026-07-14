"""SQLAlchemy data access for AI analyses (repository layer)."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import ComplaintSignal, CortexaAnalysis
from app.db.complaint import Complaint, ComplaintAIAnalysis


class AIAnalysisRepository:
    """Persistence for Cortexa analyses.

    Analyses are append-only (a complaint may have many, none overwritten), so
    the read path always returns the newest row.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        complaint_id: uuid.UUID,
        provider: str,
        model: str,
        prompt_version: str,
        processing_time: int,
        analysis: CortexaAnalysis,
        decision_intelligence: dict | None = None,
        complaint_intelligence: dict | None = None,
    ) -> ComplaintAIAnalysis:
        row = ComplaintAIAnalysis(
            complaint_id=complaint_id,
            ai_provider=provider,
            ai_model=model,
            prompt_version=prompt_version,
            processing_time=processing_time,
            category=analysis.category,
            company=analysis.company,
            product=analysis.product,
            department=analysis.department,
            location=analysis.location,
            sentiment=analysis.sentiment,
            emotion=analysis.emotion,
            severity=analysis.severity,
            priority=analysis.priority,
            summary=analysis.summary,
            language=analysis.language,
            confidence_score=analysis.confidence,
            decision_intelligence=decision_intelligence,
            complaint_intelligence=complaint_intelligence,
        )
        self._session.add(row)
        await self._session.flush()
        return row

    async def get_latest_for_complaint(
        self, complaint_id: uuid.UUID
    ) -> ComplaintAIAnalysis | None:
        """Return the most recent analysis for a complaint, or None."""
        stmt = (
            select(ComplaintAIAnalysis)
            .where(ComplaintAIAnalysis.complaint_id == complaint_id)
            .order_by(ComplaintAIAnalysis.created_at.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_history_signals(
        self, *, exclude_complaint_id: uuid.UUID, limit: int = 500
    ) -> list[ComplaintSignal]:
        """Historical complaint signals for cross-complaint intelligence (AI-003).

        Joins non-deleted complaints to their analysis, newest first, and keeps one
        (latest) signal per complaint. This is the candidate set the deterministic
        similarity scorer ranks; a future vector store would replace this retrieval
        while returning the same ``ComplaintSignal`` shape.
        """
        stmt = (
            select(
                Complaint.id,
                Complaint.description,
                Complaint.created_at,
                ComplaintAIAnalysis.company,
                ComplaintAIAnalysis.product,
                ComplaintAIAnalysis.category,
                ComplaintAIAnalysis.department,
                ComplaintAIAnalysis.severity,
                ComplaintAIAnalysis.sentiment,
            )
            .join(ComplaintAIAnalysis, ComplaintAIAnalysis.complaint_id == Complaint.id)
            .where(
                Complaint.deleted_at.is_(None),
                Complaint.id != exclude_complaint_id,
            )
            .order_by(ComplaintAIAnalysis.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)

        signals: list[ComplaintSignal] = []
        seen: set[uuid.UUID] = set()
        for row in result.all():
            if row.id in seen:
                continue
            seen.add(row.id)
            signals.append(
                ComplaintSignal(
                    company=row.company,
                    product=row.product,
                    category=row.category,
                    department=row.department,
                    severity=row.severity,
                    sentiment=row.sentiment,
                    created_at=row.created_at,
                    text=row.description,
                )
            )
        return signals
