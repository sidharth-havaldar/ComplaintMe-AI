"""Cortexa decision intelligence (AI-002).

The "so what?" layer. AI-001 answers *what happened*; this module turns that
structured analysis into the three remaining decision questions — *why does it
matter* (business impact), *what should happen next* (owner + prioritised
actions) and *how actionable is it* (actionability + reasoning).

It is deliberately provider-agnostic and pure: given a :class:`CortexaAnalysis`
it derives a :class:`CortexaDecision` with no I/O. Every provider inherits this as
its default :meth:`~app.ai.base.CortexaProvider.decide`; a future LLM provider can
override with native reasoning while reusing this as a fallback/baseline.
"""

from __future__ import annotations

from app.ai.base import CortexaAnalysis, CortexaDecision, DepartmentRecommendation

_GENERAL_CATEGORY = "General Complaint"

# Per-category decision knowledge: how the issue is framed, who owns it, why it
# matters and the default next steps (ordered by importance).
_CATEGORY_PLAYBOOK: dict[str, dict[str, object]] = {
    "Product Failure": {
        "framing": (
            "The issue points to a product durability or quality concern rather than user error."
        ),
        "department": DepartmentRecommendation(
            "Product Support", "Quality Assurance", "Customer Success"
        ),
        "impact": [
            "Potential decline in customer satisfaction and loyalty.",
            "Risk of increased warranty, repair or return claims.",
            "Possible product quality or durability concern if the pattern recurs.",
            "Negative brand perception if similar complaints increase.",
        ],
        "actions": [
            "Contact the customer to acknowledge the issue and gather device details.",
            "Investigate warranty eligibility for the reported product.",
            "Review previous complaints for the same product to detect a recurring pattern.",
            "Escalate to engineering / QA if recurrence exceeds threshold.",
        ],
    },
    "Warranty Claim": {
        "framing": (
            "Resolution likely hinges on warranty eligibility and repair or replacement options."
        ),
        "department": DepartmentRecommendation("Warranty & Repairs", "Product Support", "Finance"),
        "impact": [
            "Direct servicing or replacement cost exposure.",
            "Customer retention risk if the claim is mishandled.",
            "Compliance risk if warranty terms are applied inconsistently.",
        ],
        "actions": [
            "Verify warranty coverage and the purchase date.",
            "Offer repair or replacement in line with policy.",
            "Contact the customer with clear next steps and a timeline.",
        ],
    },
    "Delivery Issue": {
        "framing": "The problem lies in fulfillment and logistics rather than the product itself.",
        "department": DepartmentRecommendation(
            "Logistics", "Customer Support", "Vendor Management"
        ),
        "impact": [
            "Delivery-SLA and fulfillment reliability risk.",
            "Customer churn risk from a poor delivery experience.",
            "Carrier or vendor performance concern if delays recur.",
        ],
        "actions": [
            "Trace the shipment and confirm its current delivery status.",
            "Contact the customer with an updated ETA or resolution.",
            "Flag the carrier or route if delays are recurring.",
        ],
    },
    "Billing Issue": {
        "framing": "This is a billing and payment matter requiring account and transaction review.",
        "department": DepartmentRecommendation("Billing & Payments", "Finance", "Customer Support"),
        "impact": [
            "Revenue leakage or refund exposure.",
            "Trust erosion and compliance risk around billing accuracy.",
            "Dispute or chargeback risk if unresolved.",
        ],
        "actions": [
            "Review the disputed transaction and the account history.",
            "Issue a refund or correction if the charge is invalid.",
            "Confirm the resolution with the customer.",
        ],
    },
    "Service Quality": {
        "framing": "The complaint concerns the service experience and staff interaction.",
        "department": DepartmentRecommendation(
            "Customer Experience", "Training & QA", "Operations"
        ),
        "impact": [
            "Customer experience and NPS impact.",
            "Reputation risk from poor service interactions.",
            "Staff coaching or process-gap signal.",
        ],
        "actions": [
            "Review the interaction and identify the service gap.",
            "Follow up with the customer to rebuild trust.",
            "Share feedback with the relevant team for coaching.",
        ],
    },
    "Account Issue": {
        "framing": "This is a technical and access issue affecting the customer's account.",
        "department": DepartmentRecommendation("Technical Support", "Security", "Product"),
        "impact": [
            "Access disruption reduces product engagement.",
            "Increased support load.",
            "Potential security concern if access was compromised.",
        ],
        "actions": [
            "Verify the customer's identity and account status.",
            "Restore access or reset credentials as needed.",
            "Investigate for any underlying security concern.",
        ],
    },
}

_DEFAULT_PLAYBOOK: dict[str, object] = {
    "framing": "Further detail may be needed to fully classify and route the issue.",
    "department": DepartmentRecommendation("Customer Support"),
    "impact": [
        "Potential decline in customer satisfaction.",
        "Reputation risk if the issue is left unresolved.",
    ],
    "actions": [
        "Contact the customer to clarify the issue and gather missing detail.",
        "Route to the most relevant team for triage.",
    ],
}


def _playbook_for(category: str | None) -> dict[str, object]:
    if category and category in _CATEGORY_PLAYBOOK:
        return _CATEGORY_PLAYBOOK[category]
    return _DEFAULT_PLAYBOOK


def _executive_summary(analysis: CortexaAnalysis, framing: str) -> str:
    base = analysis.summary or "A customer has submitted a complaint."
    return f"{base} {framing}".strip()


def _business_impact(analysis: CortexaAnalysis, base_impact: list[str]) -> list[str]:
    impact: list[str] = []
    if analysis.severity == "High":
        impact.append(
            "Elevated risk: possible safety, security or financial exposure "
            "requiring urgent attention."
        )
    if analysis.sentiment == "Negative" and analysis.emotion == "Anger":
        impact.append("High escalation and churn risk given strong customer dissatisfaction.")
    for item in base_impact:
        if item not in impact:
            impact.append(item)
    return impact[:4]


def _recommended_actions(analysis: CortexaAnalysis, base_actions: list[str]) -> list[str]:
    actions: list[str] = []
    if analysis.severity == "High":
        actions.append(
            "Prioritise an urgent review given the elevated severity, and escalate "
            "to the owner immediately."
        )
    if analysis.product is None and analysis.category != _GENERAL_CATEGORY:
        actions.append(
            "Ask the customer for the specific product or model and any order "
            "reference to enable ownership."
        )
    for item in base_actions:
        if item not in actions:
            actions.append(item)
    return actions[:5]


def _actionability(analysis: CortexaAnalysis) -> str:
    has_product = bool(analysis.product)
    specific_category = bool(analysis.category) and analysis.category != _GENERAL_CATEGORY
    if has_product and specific_category and analysis.severity == "High":
        return "Very High"
    if has_product and specific_category:
        return "High"
    # A high-severity issue (e.g. a safety hazard) demands prompt action even when
    # the product is not fully specified, as long as there is *something* to act on.
    if analysis.severity == "High" and (specific_category or analysis.company):
        return "High"
    if has_product or specific_category or analysis.company:
        return "Medium"
    return "Low"


def _reasoning(
    analysis: CortexaAnalysis, department: DepartmentRecommendation, actionability: str
) -> str:
    parts: list[str] = []
    if analysis.product:
        parts.append(f"a specific product ({analysis.product}) is identified")
    elif analysis.company:
        parts.append(f"the company ({analysis.company}) is identified but no specific product")
    else:
        parts.append("no specific product or company is identified")

    if analysis.category and analysis.category != _GENERAL_CATEGORY:
        parts.append(f"the complaint is a clear {analysis.category.lower()}")
    else:
        parts.append("the complaint type is not clearly identifiable")

    if department.primary:
        parts.append(f"ownership maps to {department.primary}")

    return (
        "Because "
        + ", and ".join(parts)
        + f", Cortexa rates this {actionability.lower()} actionability."
    )


def derive_decision(analysis: CortexaAnalysis) -> CortexaDecision:
    """Derive decision-support intelligence from a structured analysis."""
    playbook = _playbook_for(analysis.category)
    framing = str(playbook["framing"])
    department: DepartmentRecommendation = playbook["department"]  # type: ignore[assignment]
    base_impact: list[str] = playbook["impact"]  # type: ignore[assignment]
    base_actions: list[str] = playbook["actions"]  # type: ignore[assignment]

    # For an unclassified complaint, fall back to the analysis' routing department.
    if department.primary == "Customer Support" and analysis.department:
        department = DepartmentRecommendation(analysis.department)

    actionability = _actionability(analysis)

    return CortexaDecision(
        executive_summary=_executive_summary(analysis, framing),
        business_impact=_business_impact(analysis, base_impact),
        recommended_department=department,
        recommended_actions=_recommended_actions(analysis, base_actions),
        actionability=actionability,
        reasoning=_reasoning(analysis, department, actionability),
    )
