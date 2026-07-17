"""QA-001 evaluation harness — measure only, no fixes.

Runs the 100-complaint evaluation dataset through the current Cortexa
heuristic pipeline (analyze -> decide -> intelligence) and emits:

- per-item results (results.json)
- aggregate accuracy per field, overall and sliced by difficulty/industry

Complaint intelligence is exercised two ways:
  1. isolated  — empty history (the "first complaint ever" path)
  2. corpus    — history = the other 99 eval complaints' signals, all dated
                 one day before the reference time (deterministic).
"""

from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / "backend"))

from app.ai.base import ComplaintSignal  # noqa: E402
from app.ai.decision import derive_decision  # noqa: E402
from app.ai.heuristic import analyze_text  # noqa: E402
from app.ai.intelligence import derive_intelligence  # noqa: E402

DATA = json.loads((HERE / "complaints.json").read_text(encoding="utf-8"))
COMPLAINTS = DATA["complaints"]

REF_TIME = datetime(2026, 7, 17, 12, 0, 0)


def norm(v):
    return v.lower().strip() if isinstance(v, str) else v


def main() -> None:
    # First pass: analyze everything (needed to build the corpus history).
    analyses = {}
    for item in COMPLAINTS:
        analyses[item["id"]] = analyze_text(item["complaint"])

    signals = {
        item["id"]: ComplaintSignal(
            company=analyses[item["id"]].company,
            product=analyses[item["id"]].product,
            category=analyses[item["id"]].category,
            department=analyses[item["id"]].department,
            severity=analyses[item["id"]].severity,
            sentiment=analyses[item["id"]].sentiment,
            created_at=REF_TIME - timedelta(days=1),
            text=item["complaint"],
        )
        for item in COMPLAINTS
    }

    results = []
    field_hits = Counter()
    field_totals = Counter()
    by_difficulty = defaultdict(lambda: [Counter(), Counter()])  # field -> hits/totals
    confusions = defaultdict(Counter)

    for item in COMPLAINTS:
        a = analyses[item["id"]]
        d = derive_decision(a)
        history = [sig for cid, sig in signals.items() if cid != item["id"]]
        intel_corpus = derive_intelligence(item["complaint"], a, d, history, REF_TIME)
        intel_isolated = derive_intelligence(item["complaint"], a, d, [], REF_TIME)

        exp = item["expected"]
        got = {
            "company": a.company,
            "product": a.product,
            "category": a.category,
            "department": a.department,
            "sentiment": a.sentiment,
            "severity": a.severity,
            "priority": a.priority,
        }
        row = {
            "id": item["id"],
            "industry": item["industry"],
            "difficulty": item["difficulty"],
            "expected": exp,
            "got": got,
            "match": {},
            "emotion": a.emotion,
            "confidence": a.confidence,
            "summary": a.summary,
            "decision": {
                "executive_summary": d.executive_summary,
                "actionability": d.actionability,
                "department": d.recommended_department.primary
                if d.recommended_department
                else None,
                "impact_count": len(d.business_impact),
                "actions_count": len(d.recommended_actions),
                "reasoning": d.reasoning,
            },
            "intelligence": {
                "corpus_similar_count": intel_corpus.similar_count,
                "corpus_trend": intel_corpus.trend,
                "corpus_pattern": intel_corpus.pattern,
                "corpus_risk": intel_corpus.risk_level,
                "corpus_health": intel_corpus.health_score,
                "corpus_insight": intel_corpus.executive_insight,
                "isolated_risk": intel_isolated.risk_level,
                "isolated_health": intel_isolated.health_score,
                "isolated_pattern": intel_isolated.pattern,
            },
            "notes": item.get("notes"),
        }

        for f in ("company", "product", "category", "department", "sentiment", "severity", "priority"):
            hit = norm(got[f]) == norm(exp[f])
            row["match"][f] = hit
            field_totals[f] += 1
            field_hits[f] += hit
            by_difficulty[item["difficulty"]][0][f] += hit
            by_difficulty[item["difficulty"]][1][f] += 1
            if not hit and f in ("category", "sentiment", "severity", "priority"):
                confusions[f][f"{exp[f]} -> {got[f]}"] += 1

        results.append(row)

    (HERE / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")

    print("=== OVERALL ACCURACY (n=100) ===")
    for f in field_totals:
        print(f"{f:12s} {field_hits[f]:3d}/{field_totals[f]}")

    print("\n=== BY DIFFICULTY ===")
    for diff in ("easy", "medium", "hard", "ambiguous"):
        hits, totals = by_difficulty[diff]
        n = totals["category"]
        parts = " ".join(
            f"{f}={hits[f]}/{n}" for f in ("company", "product", "category", "department", "sentiment", "severity", "priority")
        )
        print(f"{diff:10s} {parts}")

    print("\n=== TOP CONFUSIONS ===")
    for f, cnt in confusions.items():
        print(f"-- {f}")
        for pair, c in cnt.most_common(8):
            print(f"   {c:2d}  {pair}")

    # Distribution sanity for got values
    print("\n=== PREDICTED DISTRIBUTIONS ===")
    for f in ("category", "sentiment", "severity", "priority"):
        cnt = Counter(r["got"][f] for r in results)
        print(f"{f}: {dict(cnt.most_common())}")

    comp_null_expected = sum(1 for r in results if r["expected"]["company"] is None)
    comp_null_got = sum(1 for r in results if r["got"]["company"] is None)
    print(f"\ncompany: expected null={comp_null_expected}, predicted null={comp_null_got}")
    prod_null_expected = sum(1 for r in results if r["expected"]["product"] is None)
    prod_null_got = sum(1 for r in results if r["got"]["product"] is None)
    print(f"product: expected null={prod_null_expected}, predicted null={prod_null_got}")

    # Intelligence aggregates
    sim_counts = [r["intelligence"]["corpus_similar_count"] for r in results]
    print(f"\ncorpus similar_count: min={min(sim_counts)} max={max(sim_counts)} mean={sum(sim_counts)/len(sim_counts):.1f}")
    risk_cnt = Counter(r["intelligence"]["corpus_risk"] for r in results)
    print(f"corpus risk: {dict(risk_cnt.most_common())}")
    health = [r["intelligence"]["corpus_health"] for r in results]
    print(f"corpus health: min={min(health)} max={max(health)} mean={sum(health)/len(health):.1f}")
    trend_cnt = Counter(r["intelligence"]["corpus_trend"] for r in results)
    print(f"corpus trend: {dict(trend_cnt.most_common())}")
    conf = [r["confidence"] for r in results]
    print(f"analysis confidence: min={min(conf)} max={max(conf)} mean={sum(conf)/len(conf):.2f}")


if __name__ == "__main__":
    main()
