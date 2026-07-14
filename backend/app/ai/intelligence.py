"""Cortexa complaint intelligence (AI-003).

Cross-complaint intelligence. Where AI-001/AI-002 reason about a single complaint,
this module reasons across the organisation's history to answer the questions that
actually drive decisions: *has this happened before, is it getting worse, should
someone act?* It turns raw similarity into business intelligence — count, trend,
pattern, risk, an executive insight, a recommendation and a 0..100 health score.

Deterministic V1 (no vectors, no embeddings, no external calls): similarity is a
weighted overlap of company / product / category / department / failure keywords.
The provider contract (:meth:`~app.ai.base.CortexaProvider.intelligence`) is shaped
so an embedding/vector provider can replace this scoring later with no API change.
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta

from app.ai.base import (
    ComplaintSignal,
    CortexaAnalysis,
    CortexaDecision,
    CortexaIntelligence,
)

_GENERAL_CATEGORY = "General Complaint"
_SIMILAR_THRESHOLD = 0.45
_WINDOW = timedelta(days=30)

_TOKEN_RE = re.compile(r"[A-Za-z0-9']+")

_STOPWORDS = {
    "this", "that", "with", "after", "from", "have", "been", "they", "them",
    "your", "about", "which", "would", "could", "there", "their", "were", "when",
    "what", "because", "normal", "usage", "years", "year", "month", "days", "using",
    "used", "just", "only", "also", "very", "really", "still", "again", "into",
}

# Failure-mode components used for pattern detection ("repeated battery failures").
_COMPONENTS = (
    "battery", "screen", "display", "charging", "charger", "camera", "speaker",
    "microphone", "button", "keyboard", "overheating", "heating", "software",
    "update", "network", "signal", "wifi", "touchscreen", "motherboard",
)

_SEVERITY_RANK = {"High": 3, "Medium": 2, "Low": 1}


def _tokens(text: str) -> set[str]:
    return {t for t in _TOKEN_RE.findall(text.lower()) if len(t) >= 4 and t not in _STOPWORDS}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _similarity(analysis: CortexaAnalysis, tokens: set[str], other: ComplaintSignal) -> float:
    score = 0.0
    product_match = bool(
        analysis.product and other.product and analysis.product.lower() == other.product.lower()
    )
    company_match = bool(
        analysis.company and other.company and analysis.company.lower() == other.company.lower()
    )
    if product_match:
        score += 0.40
    elif company_match:
        score += 0.20
    if analysis.category and other.category and analysis.category == other.category:
        score += 0.25
    if analysis.department and other.department and analysis.department == other.department:
        score += 0.10
    score += 0.25 * _jaccard(tokens, _tokens(other.text))
    return min(score, 1.0)


def _find_component(text: str, extra: list[str]) -> str | None:
    haystack = text.lower() + " " + " ".join(extra).lower()
    for component in _COMPONENTS:
        if component in haystack:
            return component
    return None


def _trend(dates: list[datetime], reference_time: datetime) -> str:
    if len(dates) < 2:
        return "Unknown"
    recent = sum(1 for d in dates if d > reference_time - _WINDOW)
    prior = sum(1 for d in dates if reference_time - 2 * _WINDOW < d <= reference_time - _WINDOW)
    if recent > prior:
        return "Increasing"
    if recent < prior:
        return "Decreasing"
    return "Stable"


def _pattern(analysis: CortexaAnalysis, component: str | None, count: int) -> str:
    if count == 0:
        return "No recurring pattern detected yet."
    product = analysis.product
    category = analysis.category
    if category == "Product Failure":
        if component:
            base = f"Repeated {component} failures"
        else:
            base = "Repeated product failures"
        if product:
            base += f" in {product}"
        if count >= 5 and product:
            base += " — possible manufacturing defect"
        return base + "."
    if category == "Delivery Issue":
        return "Multiple recurring delivery delays."
    if category == "Billing Issue":
        return "Recurring billing disputes."
    if category == "Service Quality":
        return "Recurring customer service response issues."
    if category == "Warranty Claim":
        return "Repeated warranty claims for the same product line."
    if category == "Account Issue":
        return "Recurring account access issues."
    return "Recurring complaints of a similar nature."


def _max_severity(analysis: CortexaAnalysis, similar: list[ComplaintSignal]) -> str | None:
    best = _SEVERITY_RANK.get(analysis.severity or "", 0)
    label = analysis.severity
    for sig in similar:
        rank = _SEVERITY_RANK.get(sig.severity or "", 0)
        if rank > best:
            best, label = rank, sig.severity
    return label


def _risk(
    count: int,
    severity: str | None,
    decision: CortexaDecision,
    trend: str,
    sentiment: str | None,
) -> str:
    points = 0
    if count >= 10:
        points += 3
    elif count >= 5:
        points += 2
    elif count >= 2:
        points += 1
    if severity == "High":
        points += 2
    elif severity == "Medium":
        points += 1
    if trend == "Increasing":
        points += 2
    elif trend == "Decreasing":
        points -= 1
    if decision.actionability in ("High", "Very High"):
        points += 1
    if sentiment == "Negative":
        points += 1
    points = max(points, 0)
    if points >= 6:
        return "Critical"
    if points >= 4:
        return "High"
    if points >= 2:
        return "Medium"
    return "Low"


def _executive_insight(
    analysis: CortexaAnalysis, component: str | None, count: int, trend: str
) -> str:
    if count == 0:
        return (
            "This appears to be an isolated complaint; no significant recurring "
            "pattern has been detected yet."
        )
    subject = analysis.product or analysis.company or "this issue"
    theme = component or (analysis.category.lower() if analysis.category else "related")
    trend_clause = " and the volume is increasing" if trend == "Increasing" else ""
    if analysis.category == "Billing Issue":
        cause = "a systemic billing or process issue rather than isolated errors"
    elif analysis.category in ("Delivery Issue", "Service Quality"):
        cause = "a process or operational issue rather than isolated incidents"
    else:
        cause = "a potential product quality issue rather than isolated customer misuse"
    return (
        f"{theme.capitalize()}-related complaints for {subject} appear repeatedly "
        f"({count} similar found){trend_clause}. The recurrence suggests {cause}."
    )


def _recommendation(analysis: CortexaAnalysis, risk: str, count: int) -> list[str]:
    if count == 0 or risk == "Low":
        return [
            "Handle through standard support.",
            "Continue monitoring for emerging patterns.",
        ]
    category = analysis.category
    if category in ("Product Failure", "Warranty Claim"):
        actions = [
            "Escalate to Product Engineering.",
            "Open a quality investigation.",
            "Notify product management.",
        ]
    elif category == "Delivery Issue":
        actions = [
            "Escalate to Logistics operations.",
            "Audit carrier and route performance.",
            "Notify operations management.",
        ]
    elif category == "Billing Issue":
        actions = [
            "Escalate to Finance / Billing.",
            "Audit recent transactions for a systemic error.",
            "Notify billing management.",
        ]
    elif category == "Service Quality":
        actions = [
            "Escalate to Customer Experience leadership.",
            "Review service processes and coaching.",
        ]
    else:
        actions = ["Escalate to the responsible team for investigation."]
    actions.append("Monitor future complaints for continued recurrence.")
    if risk == "Critical":
        actions.insert(0, "Treat as critical: engage the incident owner immediately.")
    return actions


def _health(
    count: int,
    severity: str | None,
    decision: CortexaDecision,
    trend: str,
    risk: str,
    analysis: CortexaAnalysis,
) -> tuple[int, list[str]]:
    penalty = 0
    reasons: list[str] = []

    if count >= 2:
        penalty += min(count, 10) * 2
        reasons.append("Repeated complaints")
    if analysis.sentiment == "Negative":
        penalty += 15 if analysis.emotion == "Anger" else 10
        reasons.append("Negative sentiment")
    if decision.actionability in ("High", "Very High"):
        penalty += 12 if decision.actionability == "Very High" else 8
        reasons.append("High actionability")
    if trend == "Increasing":
        penalty += 15
        reasons.append("Increasing trend")
    elif trend == "Decreasing":
        penalty -= 5
    if severity == "High":
        penalty += 12
        reasons.append("High severity")
    elif severity == "Medium":
        penalty += 6
    if risk in ("High", "Critical") and analysis.category in ("Product Failure", "Warranty Claim"):
        reasons.append("Engineering attention recommended")

    score = max(0, min(100, 100 - penalty))
    return score, reasons


def derive_intelligence(
    text: str,
    analysis: CortexaAnalysis,
    decision: CortexaDecision,
    history: list[ComplaintSignal],
    reference_time: datetime,
) -> CortexaIntelligence:
    """Derive complaint intelligence from this complaint and historical signals."""
    tokens = _tokens(text)
    scored = [
        (score, sig)
        for sig in history
        if (score := _similarity(analysis, tokens, sig)) >= _SIMILAR_THRESHOLD
    ]
    similar = [sig for _, sig in scored]
    count = len(scored)

    if count:
        confidences = [s for s, _ in scored]
        mean = sum(confidences) / len(confidences)
        similarity_confidence = round(100 * (0.5 * mean + 0.5 * max(confidences)))
    else:
        similarity_confidence = 0

    trend = _trend([sig.created_at for sig in similar], reference_time)
    component = _find_component(text, [sig.text for sig in similar])
    pattern = _pattern(analysis, component, count)
    severity = _max_severity(analysis, similar)
    risk = _risk(count, severity, decision, trend, analysis.sentiment)
    insight = _executive_insight(analysis, component, count, trend)
    recommendation = _recommendation(analysis, risk, count)
    health_score, health_reasons = _health(count, severity, decision, trend, risk, analysis)

    return CortexaIntelligence(
        similar_count=count,
        similarity_confidence=similarity_confidence,
        trend=trend,
        pattern=pattern,
        risk_level=risk,
        executive_insight=insight,
        business_recommendation=recommendation,
        health_score=health_score,
        health_reasons=health_reasons,
    )
