"""Pydantic request/response schemas for the Complaint API."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field


class ComplaintCreate(BaseModel):
    """Payload for creating a complaint."""

    description: str = Field(min_length=1)
    title: str | None = Field(default=None, max_length=255)


class ComplaintUpdate(BaseModel):
    """Partial payload for updating a complaint. All fields optional."""

    description: str | None = Field(default=None, min_length=1)
    title: str | None = Field(default=None, max_length=255)
    current_status: str | None = Field(default=None, max_length=50)


class ComplaintResponse(BaseModel):
    """Complaint representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    organization_id: uuid.UUID | None
    title: str | None
    description: str
    current_status: str
    created_at: datetime
    updated_at: datetime


class DepartmentRecommendationResponse(BaseModel):
    """Recommended ownership: primary owner plus supporting teams (AI-002)."""

    primary: str | None = None
    secondary: str | None = None
    optional: str | None = None


class DecisionIntelligenceResponse(BaseModel):
    """Cortexa's decision-support layer — the "so what should we do next" (AI-002)."""

    executive_summary: str | None = None
    business_impact: list[str] = Field(default_factory=list)
    recommended_department: DepartmentRecommendationResponse | None = None
    recommended_actions: list[str] = Field(default_factory=list)
    actionability: str | None = None
    reasoning: str | None = None


class ComplaintIntelligenceResponse(BaseModel):
    """Cortexa's cross-complaint intelligence — "has this happened before?" (AI-003)."""

    similar_count: int = 0
    similarity_confidence: int = 0
    trend: str | None = None
    pattern: str | None = None
    risk_level: str | None = None
    executive_insight: str | None = None
    business_recommendation: list[str] = Field(default_factory=list)
    health_score: int | None = None
    health_reasons: list[str] = Field(default_factory=list)


class AIAnalysisResponse(BaseModel):
    """Cortexa's structured analysis of a complaint.

    ``named_entities`` is derived from the structured fields rather than stored,
    so the response is richer than the table without any schema change.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ai_provider: str
    ai_model: str
    category: str | None
    company: str | None
    product: str | None
    department: str | None
    location: str | None
    sentiment: str | None
    emotion: str | None
    severity: str | None
    priority: str | None
    summary: str | None
    language: str | None
    confidence_score: float | None
    decision_intelligence: DecisionIntelligenceResponse | None = None
    complaint_intelligence: ComplaintIntelligenceResponse | None = None
    created_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def named_entities(self) -> list[str]:
        entities: list[str] = []
        for value in (self.company, self.product, self.location):
            if value and value not in entities:
                entities.append(value)
        return entities


class ComplaintDetailResponse(ComplaintResponse):
    """Complaint plus its latest Cortexa analysis (null while still analyzing).

    Additive over ``ComplaintResponse`` — existing consumers are unaffected.
    """

    ai_analysis: AIAnalysisResponse | None = None
