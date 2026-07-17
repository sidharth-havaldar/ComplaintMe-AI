"""Heuristic Consumer Copilot provider — the deterministic V1 drafter.

Turns a consumer's natural story into a professional complaint draft using
sentence normalization and light pattern matching. It needs no API key, no
network and no extra dependencies, mirroring the Cortexa heuristic engine
(``app.ai.heuristic``) architecturally while remaining a separate pillar.

The one hard rule (see :mod:`app.copilot.base`): NEVER fabricate. Every fact in
the draft comes from the user's own sentences. The drafter only

- normalizes grammar mechanics (capitalization, spacing, punctuation),
- adds professional framing sentences that assert nothing factual,
- reorganizes the user's sentences into sections (summary, timeline, body),
- inserts explicit ``[...]`` placeholders where information is missing.

Dates, prices, invoices, warranty status and events are surfaced only when the
user stated them.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.copilot.base import ComplaintDraft, CopilotProvider

_SENTENCE_RE = re.compile(r"[^.!?\n]+[.!?]*")
_WORD_RE = re.compile(r"[A-Za-z0-9']+")

# --- Time references -------------------------------------------------------
# A sentence mentioning any of these is treated as a timeline event. The
# sentence itself (the user's words, normalized) becomes the timeline entry, so
# no date is ever invented — only quoted.
_MONTHS = (
    "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december",
)
_TIME_PATTERNS = tuple(
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\b(?:yesterday|today|tonight|this (?:morning|afternoon|evening|week|month))\b",
        r"\blast (?:night|week|month|year|[a-z]+day)\b",
        r"\b\d+\s+(?:day|week|month|year|hour)s?\s+ago\b",
        r"\b(?:" + "|".join(_MONTHS) + r")\b",
        r"\b\d{1,2}(?:st|nd|rd|th)\b",
        r"\b20\d{2}\b",
        r"\b(?:within|after|for)\s+(?:the\s+)?(?:\d+|a|an|two|three|four|five|six|seven|eight|nine|ten)\s+(?:business\s+)?(?:day|week|month|year|hour)s?\b",
        r"\b(?:since|on)\s+\d",
    )
)

# --- Entity detection ------------------------------------------------------
# Mid-sentence capitalized phrases are the strongest honest signal for "what
# this complaint is about" without a curated brand list. Sentence-initial words
# are accepted only when they are not ordinary English sentence starters.
_COMMON_STARTERS = {
    "i", "i'm", "i've", "my", "the", "a", "an", "it", "it's", "we", "our",
    "this", "that", "these", "those", "there", "they", "he", "she", "you",
    "after", "before", "when", "where", "why", "how", "what", "who", "which",
    "please", "however", "also", "and", "but", "so", "then", "now", "even",
    "every", "each", "no", "nobody", "nothing", "someone", "something",
    "yesterday", "today", "last", "first", "finally", "eventually", "ever",
    "since", "despite", "although", "because", "if", "in", "on", "at", "for",
    "to", "from", "with", "not", "do", "does", "did", "is", "was", "are",
    "were", "have", "has", "had", "one", "two", "three", "customer",
}


def _is_capitalized(token: str) -> bool:
    return token[0].isupper() or any(ch.isdigit() for ch in token)


def _detect_entity(text: str) -> str | None:
    """Find the most likely product/company phrase in the user's own words."""
    for sentence in _SENTENCE_RE.findall(text):
        tokens = _WORD_RE.findall(sentence)
        # In an all-caps (shouted) sentence, capitalization carries no signal.
        alpha = [t for t in tokens if t.isalpha()]
        if alpha and all(t.isupper() for t in alpha):
            continue
        for i, token in enumerate(tokens):
            if token.lower() == "i" or not token[0].isupper():
                continue
            if i == 0 and token.lower() in _COMMON_STARTERS:
                continue
            if i > 0 and tokens[i - 1].lower() in ("mr", "mrs", "ms", "dr"):
                continue
            phrase = [token]
            j = i + 1
            while j < len(tokens) and len(phrase) < 4 and _is_capitalized(tokens[j]):
                phrase.append(tokens[j])
                j += 1
            return " ".join(phrase)
    return None


def _entity_brand(entity: str) -> str | None:
    """The brand-ish part of an entity for addressing the recipient.

    When the phrase includes a model token with digits ("Samsung Galaxy S23"),
    it is a product name and the brand is its first word ("Samsung"). Without
    digits, the whole phrase is kept — it may itself be the company name.
    """
    tokens = entity.split()
    if any(any(ch.isdigit() for ch in t) for t in tokens):
        return tokens[0] if tokens and not any(ch.isdigit() for ch in tokens[0]) else None
    return entity or None


# --- Issue framing ----------------------------------------------------------


@dataclass(frozen=True, slots=True)
class _IssueProfile:
    """Professional framing for one issue type. Framing sentences are factual
    only about *classification*, never about events."""

    key: str
    subject_entity: str  # format with {entity}
    subject_plain: str
    topic_entity: str  # "regarding <topic>" — format with {entity}
    topic_plain: str
    keywords: tuple[str, ...]


_ISSUE_PROFILES: tuple[_IssueProfile, ...] = (
    _IssueProfile(
        "safety",
        "Safety Concern Involving {entity}",
        "Safety Concern",
        "a safety concern involving my {entity}",
        "a safety concern",
        ("caught fire", "fire", "sparked", "spark", "smoke", "exploded", "explosion",
         "burn", "burns", "injury", "injured", "dangerous", "unsafe", "hazard",
         "electric shock", "shocked me"),
    ),
    _IssueProfile(
        "failure",
        "Premature Failure of {entity}",
        "Product Failure",
        "the premature failure of my {entity}",
        "the failure of a product I purchased",
        ("stopped working", "not working", "doesn't work", "does not work",
         "won't turn on", "not turning on", "stopped functioning", "broke", "broken",
         "defective", "faulty", "malfunction", "dead", "failed", "failure",
         "crashes", "crashed", "keeps restarting"),
    ),
    _IssueProfile(
        "warranty",
        "Warranty Claim for {entity}",
        "Warranty Claim",
        "a warranty matter concerning my {entity}",
        "a warranty matter",
        ("warranty", "guarantee"),
    ),
    _IssueProfile(
        "delivery",
        "Delivery Issue with {entity} Order",
        "Delivery Issue",
        "a delivery issue concerning my {entity} order",
        "a delivery issue concerning my order",
        ("delivery", "delivered", "shipping", "courier", "dispatch", "tracking",
         "parcel", "package", "never arrived", "not arrived"),
    ),
    _IssueProfile(
        "billing",
        "Billing Dispute with {entity}",
        "Billing Dispute",
        "a billing dispute concerning {entity}",
        "a billing dispute",
        ("charged", "overcharged", "double charge", "billed", "debited", "refund",
         "payment", "invoice", "fee", "money back", "transaction"),
    ),
    _IssueProfile(
        "service",
        "Unsatisfactory Service Experience with {entity}",
        "Unsatisfactory Service Experience",
        "the quality of service I received from {entity}",
        "the quality of service I received",
        ("rude", "staff", "customer service", "service center", "service centre",
         "unprofessional", "no response", "ignored", "waited", "waiting",
         "no one responded", "behaviour", "behavior"),
    ),
    _IssueProfile(
        "account",
        "Account Access Issue with {entity}",
        "Account Access Issue",
        "an account access issue with {entity}",
        "an account access issue",
        ("login", "log in", "logged out", "password", "account", "locked",
         "blocked", "otp", "cannot access", "can't access"),
    ),
)

_DEFAULT_PROFILE = _IssueProfile(
    "general",
    "Formal Complaint Regarding {entity}",
    "Formal Complaint",
    "my recent experience with {entity}",
    "a recent experience",
    (),
)


def _detect_issue(lowered: str) -> _IssueProfile:
    """Pick the profile with the most keyword evidence; ties favor the order
    above (safety first). One incidental keyword never outvotes the dominant
    theme of the story."""
    best = _DEFAULT_PROFILE
    best_hits = 0
    for profile in _ISSUE_PROFILES:
        hits = sum(1 for keyword in profile.keywords if keyword in lowered)
        if hits > best_hits:
            best, best_hits = profile, hits
    return best


# --- Requested resolution ---------------------------------------------------
# Chosen from what the user actually asked for; the neutral fallback requests
# an investigation rather than inventing a demand. Order encodes precedence
# ("I want a refund, not a replacement" resolves to Refund).

_RESOLUTIONS: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    ("Refund", "I respectfully request a refund for this matter.",
     ("refund", "money back", "reimburse", "return my money", "chargeback",
      "want my money")),
    ("Replacement", "I respectfully request a replacement.",
     ("replacement", "replace", "exchange", "new unit")),
    ("Repair", "I respectfully request that the issue be repaired.",
     ("repair", "repaired", "fix it", "fixed", "fix the")),
)

_DEFAULT_RESOLUTION = (
    "Further Investigation",
    "I respectfully request an investigation into this matter and an appropriate resolution.",
)


def _detect_resolution(lowered: str) -> tuple[str, str]:
    for label, sentence, keywords in _RESOLUTIONS:
        if any(keyword in lowered for keyword in keywords):
            return label, sentence
    return _DEFAULT_RESOLUTION


# --- Sentence normalization -------------------------------------------------

_EMOTION_ONLY_WORDS = (
    "angry", "furious", "mad", "hate", "disgusted", "disgusting", "fed up",
    "pissed", "sick of this", "ridiculous", "pathetic",
)
_PROFESSIONAL_DISSATISFACTION = "I am deeply dissatisfied with this experience."


def _normalize_sentence(sentence: str) -> str:
    """Mechanical cleanup only: spacing, shouting, punctuation, capitalization."""
    cleaned = " ".join(sentence.split())
    if not cleaned:
        return ""
    letters = [ch for ch in cleaned if ch.isalpha()]
    if len(letters) > 3 and all(ch.isupper() for ch in letters):
        cleaned = cleaned.capitalize()
    cleaned = re.sub(r"!+\?*|\?+!+", ".", cleaned)
    cleaned = re.sub(r"\.{2,}", ".", cleaned)
    cleaned = cleaned[0].upper() + cleaned[1:]
    if cleaned[-1] not in ".?":
        cleaned += "."
    return cleaned


def _is_emotion_only(sentence: str) -> bool:
    """True for short, purely emotional statements carrying no facts."""
    lowered = sentence.lower()
    words = _WORD_RE.findall(lowered)
    if len(words) > 7 or any(ch.isdigit() for ch in sentence):
        return False
    return any(term in lowered for term in _EMOTION_ONLY_WORDS)


def _split_sentences(text: str) -> list[str]:
    return [s.strip() for s in _SENTENCE_RE.findall(text) if s.strip()]


def _mentions_time(sentence: str) -> bool:
    return any(pattern.search(sentence) for pattern in _TIME_PATTERNS)


# --- The provider -----------------------------------------------------------


class HeuristicCopilotProvider(CopilotProvider):
    """Deterministic, dependency-free Consumer Copilot drafter (V1 default)."""

    name = "copilot-heuristic"
    model = "draft-rules-v1"

    async def draft(self, story: str) -> ComplaintDraft:
        return draft_complaint(story)


def draft_complaint(story: str) -> ComplaintDraft:
    """Pure, synchronous drafting — the heart of the heuristic Copilot."""
    lowered = story.lower()
    issue = _detect_issue(lowered)
    resolution_label, resolution_sentence = _detect_resolution(lowered)
    entity = _detect_entity(story)

    # Subject and framing topic — entity only when the user named one.
    if entity:
        subject = issue.subject_entity.format(entity=entity)
        topic = issue.topic_entity.format(entity=entity)
    else:
        subject = issue.subject_plain
        topic = issue.topic_plain

    # Recipient: the brand if stated, an explicit placeholder otherwise.
    brand = _entity_brand(entity) if entity else None
    recipient = (
        f"Customer Service Department, {brand}"
        if brand
        else "Customer Service Department, [Company Name]"
    )

    # Normalize the user's sentences; fold pure venting into one professional
    # dissatisfaction line (their sentiment, restated — never new facts).
    details: list[str] = []
    timeline: list[str] = []
    dissatisfaction_added = False
    for raw in _split_sentences(story):
        if _is_emotion_only(raw):
            if not dissatisfaction_added:
                details.append(_PROFESSIONAL_DISSATISFACTION)
                dissatisfaction_added = True
            continue
        normalized = _normalize_sentence(raw)
        if not normalized or normalized in details:
            continue
        details.append(normalized)
        if _mentions_time(raw) and len(timeline) < 6:
            timeline.append(normalized)

    opening = f"I am writing to formally raise a complaint regarding {topic}."
    detail_paragraph = " ".join(details)
    closing = "I look forward to your response and a timely resolution."
    body = "\n\n".join(
        part for part in (opening, detail_paragraph, resolution_sentence, closing) if part
    ) + "\n\nSincerely,\n[Your Name]"

    summary = f"A formal complaint regarding {topic}. Requested resolution: {resolution_label}."

    return ComplaintDraft(
        subject=subject,
        recipient=recipient,
        summary=summary,
        timeline=timeline,
        body=body,
        requested_resolution=resolution_label,
        provider=HeuristicCopilotProvider.name,
        model=HeuristicCopilotProvider.model,
    )
