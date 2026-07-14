"""Cortexa provider contract (AI-001, AI-002).

Cortexa is a complaint *intelligence* engine, not a chatbot. Providers turn one
unstructured complaint into structured extraction (:class:`CortexaAnalysis`, the
"what happened") and then into decision-support intelligence (:class:`CortexaDecision`,
the "so what should the business do next"). Providers are the swappable
implementations of that job — a rule-based engine today, a hosted LLM tomorrow —
selected at runtime by :func:`app.ai.factory.get_cortexa_provider`.

The rest of the system (service, repository, API) depends only on this contract,
never on a concrete provider, so a new provider can be added without touching the
pipeline or the database.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime


@dataclass(slots=True)
class CortexaAnalysis:
    """The structured intelligence Cortexa extracts from a complaint.

    Fields map 1:1 onto columns of the existing ``complaint_ai_analysis`` table.
    ``confidence`` is a 0..1 score. Named entities are intentionally absent: they
    are derived from the structured fields at the API layer (see the response
    schema), so no new column is required.
    """

    company: str | None
    product: str | None
    category: str | None
    department: str | None
    location: str | None
    sentiment: str | None
    emotion: str | None
    severity: str | None
    priority: str | None
    language: str | None
    summary: str | None
    confidence: float


@dataclass(slots=True)
class DepartmentRecommendation:
    """Who should own the complaint — primary owner plus supporting teams."""

    primary: str | None
    secondary: str | None = None
    optional: str | None = None


@dataclass(slots=True)
class CortexaDecision:
    """Decision-support intelligence derived from a :class:`CortexaAnalysis` (AI-002).

    This is the "so what?" layer: it turns extracted facts into an executive
    summary, business impact, ownership, prioritised actions and an actionability
    rating so a manager can decide what to do next. Persisted as a JSON payload in
    ``complaint_ai_analysis.decision_intelligence`` (one additive nullable column).
    """

    executive_summary: str
    business_impact: list[str] = field(default_factory=list)
    recommended_department: DepartmentRecommendation | None = None
    recommended_actions: list[str] = field(default_factory=list)
    actionability: str = "Low"  # Low | Medium | High | Very High
    reasoning: str = ""


@dataclass(slots=True)
class ComplaintSignal:
    """A compact historical complaint used to compute cross-complaint intelligence.

    Built by the service from stored complaints + their analysis, then handed to
    the provider. Keeping it minimal (and provider-facing) means a future vector
    retriever can supply the same shape without changing the provider contract.
    """

    company: str | None
    product: str | None
    category: str | None
    department: str | None
    severity: str | None
    sentiment: str | None
    created_at: datetime
    text: str


@dataclass(slots=True)
class CortexaIntelligence:
    """Cross-complaint intelligence (AI-003) — "has this happened before?".

    Turns similarity into business intelligence: how often, trending which way,
    how risky, what the pattern is, and what to do — plus a 0..100 complaint
    health score. Persisted as JSON in ``complaint_ai_analysis.complaint_intelligence``.
    """

    similar_count: int = 0
    similarity_confidence: int = 0  # 0..100
    trend: str = "Unknown"  # Increasing | Stable | Decreasing | Unknown
    pattern: str = ""
    risk_level: str = "Low"  # Low | Medium | High | Critical
    executive_insight: str = ""
    business_recommendation: list[str] = field(default_factory=list)
    health_score: int = 100  # 0..100 (lower = worse health)
    health_reasons: list[str] = field(default_factory=list)


class CortexaProvider(ABC):
    """A swappable complaint-intelligence backend.

    Concrete providers declare a stable ``name`` / ``model`` / ``prompt_version``
    (persisted for provenance and A/B comparison of future models) and implement
    :meth:`analyze`. Decision intelligence (:meth:`decide`) and cross-complaint
    intelligence (:meth:`intelligence`) ship with provider-agnostic defaults so
    *every* provider — including future LLM / embedding ones — supports them
    automatically; a provider MAY override either to reason natively.
    """

    name: str
    model: str
    prompt_version: str

    @abstractmethod
    async def analyze(self, text: str) -> CortexaAnalysis:
        """Transform raw complaint text into a structured analysis."""
        raise NotImplementedError

    async def decide(self, text: str, analysis: CortexaAnalysis) -> CortexaDecision:
        """Turn a structured analysis into decision-support intelligence.

        Default: deterministic derivation from the structured fields (see
        :func:`app.ai.decision.derive_decision`). Inherited by every provider, so
        new providers get decision intelligence for free and can override to use an
        LLM's native reasoning over ``text``.
        """
        from app.ai.decision import derive_decision

        return derive_decision(analysis)

    async def intelligence(
        self,
        text: str,
        analysis: CortexaAnalysis,
        decision: CortexaDecision,
        history: list[ComplaintSignal],
        reference_time: datetime,
    ) -> CortexaIntelligence:
        """Turn this complaint + historical complaints into complaint intelligence.

        Answers "has this happened before, is it getting worse, should someone
        act?". Default: deterministic similarity + trend/risk scoring (see
        :func:`app.ai.intelligence.derive_intelligence`). ``history`` is the
        candidate set the service supplies; a future embedding/vector provider can
        override the scoring while keeping this exact signature — so embeddings can
        replace the V1 strategy without any API change.
        """
        from app.ai.intelligence import derive_intelligence

        return derive_intelligence(text, analysis, decision, history, reference_time)

