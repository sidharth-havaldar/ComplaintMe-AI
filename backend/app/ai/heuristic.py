"""Heuristic Cortexa provider — the deterministic V1 understanding engine.

This provider extracts structured intelligence from a complaint using curated
lexicons and light pattern matching. It needs no API key, no network and no extra
dependencies, so the full pipeline runs and is verifiable today at zero cost.

It deliberately implements the same :class:`~app.ai.base.CortexaProvider` contract
a hosted-LLM provider will implement later, so upgrading Cortexa's intelligence is
a configuration change (``CORTEXA_PROVIDER``), not a rewrite.
"""

from __future__ import annotations

import re

from app.ai.base import CortexaAnalysis, CortexaProvider

# Brand surface form (lowercased) -> canonical company name. Products are the
# brand plus a trailing model token (e.g. "OPPO F17", "iPhone 13").
_KNOWN_BRANDS: dict[str, str] = {
    "oppo": "OPPO",
    "samsung": "Samsung",
    "apple": "Apple",
    "iphone": "Apple",
    "ipad": "Apple",
    "macbook": "Apple",
    "xiaomi": "Xiaomi",
    "redmi": "Xiaomi",
    "oneplus": "OnePlus",
    "vivo": "Vivo",
    "realme": "realme",
    "nokia": "Nokia",
    "motorola": "Motorola",
    "google": "Google",
    "pixel": "Google",
    "sony": "Sony",
    "asus": "Asus",
    "lenovo": "Lenovo",
    "dell": "Dell",
    "amazon": "Amazon",
    "flipkart": "Flipkart",
    "myntra": "Myntra",
    "swiggy": "Swiggy",
    "zomato": "Zomato",
    "uber": "Uber",
    "ola": "Ola",
    "paytm": "Paytm",
    "jio": "Jio",
    "airtel": "Airtel",
    "vodafone": "Vodafone",
}

# Tokens that, following a brand, form part of a product/model name.
_MODEL_WORDS = {
    "galaxy", "note", "pro", "max", "ultra", "plus", "mini", "air", "lite",
    "neo", "prime", "book", "pad", "tab", "watch", "series", "edge", "fold",
}

_GENERAL_CATEGORY = "General Complaint"

# Ordered category rules — first match wins. Each maps to a routing department.
_CATEGORY_RULES: list[tuple[str, str, tuple[str, ...]]] = [
    (
        "Product Failure",
        "Customer Support",
        ("stopped working", "not working", "doesn't work", "does not work", "stopped",
         "broke", "broken", "malfunction", "defective", "faulty", "dead", "failed",
         "won't turn on", "not turning on",
         # Safety-critical hardware failures — routed here and flagged High severity.
         "caught fire", "fire", "exploded", "overheated", "overheating", "smoke", "sparked"),
    ),
    (
        "Warranty Claim",
        "Warranty & Repairs",
        ("warranty", "guarantee", "replacement", "replace", "repair"),
    ),
    (
        "Delivery Issue",
        "Logistics",
        ("delivery", "delivered", "shipping", "courier", "dispatch", "tracking", "package"),
    ),
    (
        "Billing Issue",
        "Billing & Payments",
        ("refund", "charged", "overcharged", "payment", "invoice", "billed",
         "debited", "transaction", "money back"),
    ),
    (
        "Service Quality",
        "Customer Experience",
        ("rude", "staff", "behaviour", "behavior", "unprofessional", "customer service",
         "support", "waited", "waiting"),
    ),
    (
        "Account Issue",
        "Technical Support",
        ("login", "log in", "account", "password", "access", "blocked", "locked", "otp"),
    ),
]

_NEGATIVE_WORDS = {
    "not", "no", "stopped", "broke", "broken", "fail", "failed", "terrible",
    "worst", "bad", "poor", "disappointed", "frustrated", "frustrating", "angry",
    "unacceptable", "horrible", "useless", "defective", "faulty", "damaged",
    "refund", "never", "delay", "delayed", "rude", "waste", "cheated", "scam",
    "issue", "problem", "complaint", "unable", "cannot", "wrong",
}
_POSITIVE_WORDS = {
    "good", "great", "excellent", "happy", "satisfied", "love", "thanks",
    "thank", "resolved", "helpful", "smooth",
}

_ANGER_WORDS = ("furious", "angry", "outrageous", "ridiculous", "unacceptable",
                "worst", "horrible", "disgusting", "fed up")
_FRUSTRATION_WORDS = ("frustrated", "frustrating", "again", "repeatedly", "still",
                      "stopped working", "not working", "waiting", "delay", "keeps")
_DISAPPOINT_WORDS = ("disappointed", "let down", "expected", "unhappy", "sad")

_HIGH_SEVERITY_WORDS = ("fire", "smoke", "injury", "injured", "hazard", "danger",
                        "dangerous", "safety", "security", "fraud", "hacked",
                        "unauthorized", "data breach", "urgent", "emergency",
                        "completely", "never worked")
_LOW_SEVERITY_WORDS = ("minor", "small", "slight", "slightly", "cosmetic", "scratch",
                       "tiny", "occasionally")
_URGENCY_WORDS = ("urgent", "asap", "immediately", "emergency", "right away")

_TOKEN_RE = re.compile(r"[A-Za-z0-9']+")


def _is_model_token(token: str) -> bool:
    return any(ch.isdigit() for ch in token) or token.lower() in _MODEL_WORDS


def _detect_company_product(tokens: list[str]) -> tuple[str | None, str | None]:
    for i, token in enumerate(tokens):
        canonical = _KNOWN_BRANDS.get(token.lower())
        if canonical is None:
            continue
        surface = [token]
        j = i + 1
        while j < len(tokens) and len(surface) < 3 and _is_model_token(tokens[j]):
            surface.append(tokens[j])
            j += 1
        product = " ".join(surface) if len(surface) > 1 else None
        return canonical, product
    return None, None


def _detect_category(text: str) -> tuple[str, str]:
    for category, department, keywords in _CATEGORY_RULES:
        if any(keyword in text for keyword in keywords):
            return category, department
    return _GENERAL_CATEGORY, "Customer Support"


def _detect_sentiment(tokens: set[str], text: str) -> str:
    negatives = len(tokens & _NEGATIVE_WORDS) + sum(
        phrase in text for phrase in ("not working", "stopped working")
    )
    positives = len(tokens & _POSITIVE_WORDS)
    if negatives > positives:
        return "Negative"
    if positives > negatives:
        return "Positive"
    return "Neutral"


def _detect_emotion(sentiment: str, text: str) -> str:
    if any(word in text for word in _ANGER_WORDS):
        return "Anger"
    if any(word in text for word in _FRUSTRATION_WORDS):
        return "Frustration"
    if any(word in text for word in _DISAPPOINT_WORDS):
        return "Disappointment"
    return "Frustration" if sentiment == "Negative" else "Neutral"


def _detect_severity(text: str) -> str:
    if any(word in text for word in _HIGH_SEVERITY_WORDS):
        return "High"
    if any(word in text for word in _LOW_SEVERITY_WORDS):
        return "Low"
    return "Medium"


def _detect_priority(severity: str, text: str) -> str:
    if severity == "High" or any(word in text for word in _URGENCY_WORDS):
        return "High"
    if severity == "Low":
        return "Low"
    return "Medium"


def _detect_language(text: str) -> str:
    if any("ऀ" <= ch <= "ॿ" for ch in text):
        return "Hindi"
    return "English"


def _summarize(category: str, company: str | None, product: str | None) -> str:
    subject = product or company or "the reported product or service"
    return f"Customer reports a {category.lower()} involving {subject}."


def _confidence(
    company: str | None,
    product: str | None,
    category: str,
    sentiment: str,
    emotion: str,
    language: str | None,
) -> float:
    score = 0.40
    score += 0.15 if company else 0.0
    score += 0.12 if product else 0.0
    score += 0.12 if category != _GENERAL_CATEGORY else 0.0
    score += 0.07 if sentiment != "Neutral" else 0.0
    score += 0.05 if emotion != "Neutral" else 0.0
    score += 0.05 if language else 0.0
    return round(min(score, 0.98), 2)


def analyze_text(text: str) -> CortexaAnalysis:
    """Pure, synchronous analysis — the heart of the heuristic engine."""
    lowered = text.lower()
    raw_tokens = _TOKEN_RE.findall(text)
    lower_tokens = {token.lower() for token in raw_tokens}

    company, product = _detect_company_product(raw_tokens)
    category, department = _detect_category(lowered)
    sentiment = _detect_sentiment(lower_tokens, lowered)
    emotion = _detect_emotion(sentiment, lowered)
    severity = _detect_severity(lowered)
    priority = _detect_priority(severity, lowered)
    language = _detect_language(text)
    summary = _summarize(category, company, product)
    confidence = _confidence(company, product, category, sentiment, emotion, language)

    return CortexaAnalysis(
        company=company,
        product=product,
        category=category,
        department=department,
        location=None,
        sentiment=sentiment,
        emotion=emotion,
        severity=severity,
        priority=priority,
        language=language,
        summary=summary,
        confidence=confidence,
    )


class HeuristicCortexaProvider(CortexaProvider):
    """Deterministic, dependency-free Cortexa engine (V1 default)."""

    name = "cortexa-heuristic"
    model = "rules-v1"
    prompt_version = "cortexa-v1"

    async def analyze(self, text: str) -> CortexaAnalysis:
        return analyze_text(text)
