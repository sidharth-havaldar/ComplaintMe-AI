# Cortexa — The ComplaintMe AI Intelligence Engine

> The AI specification. Describes what Cortexa is, what it is not, what is
> implemented today, and where it is going. Implementation status is marked
> explicitly — nothing planned is described as shipped.

---

## What Cortexa Is

Cortexa is a **decision-support intelligence engine**. It transforms a raw,
free-text complaint into progressively more decision-ready intelligence:
structured understanding, recommended action, and cross-complaint pattern
analysis.

Cortexa is **model-agnostic**. All intelligence flows through a single
provider contract (`CortexaProvider` in `backend/app/ai/base.py`), so the
engine behind it — today a deterministic heuristic, tomorrow a hosted LLM —
can change without touching services, APIs, or the frontend.

## What Cortexa Is NOT

- **Not a data extraction engine.** Extracting fields is the first step, never
  the product (see Principle #1).
- **Not a chatbot.** Cortexa does not converse; it analyzes and recommends.
- **Not a similarity search.** AI-003 uses similarity internally, but its
  output is intelligence (trend, risk, recommendation) — never a raw list of
  "related tickets".
- **Not tied to any vendor.** No provider SDK appears outside the provider
  layer.

---

## Permanent Principles

### CORTEXA PRINCIPLE #1

Cortexa is NOT a data extraction engine.

Understanding is only the first step.

Every analysis must help someone make a better decision.

If Cortexa cannot answer **"So what?"**, the analysis is incomplete.

### CORTEXA PRINCIPLE #2

Cortexa should never answer only **"What happened?"**

It should also answer:

- Has this happened before?
- Is it getting worse?
- Should someone act?

### CORTEXA PRINCIPLE #3

Cortexa progressively reduces the amount of information a human must read.

```
Raw Complaint
      ↓
Structured Understanding
      ↓
Decision Intelligence
      ↓
Complaint Intelligence
      ↓
Executive Dashboard
      ↓
Executive Action
```

Each layer consumes the one above it and emits something shorter and more
actionable. The end state is an executive who reads one screen and acts.

---

## Current Architecture (Implemented)

```
POST /complaints                       (API answers immediately)
      │
      └── FastAPI BackgroundTask
                │
                ▼
      CortexaAnalysisService          backend/app/services/cortexa.py
                │
                ▼
      CortexaProvider (factory)       backend/app/ai/factory.py
      selected by CORTEXA_PROVIDER    (default: "heuristic")
                │
     ┌──────────┼──────────────┐
     ▼          ▼              ▼
  analyze()   decide()    intelligence()
  (AI-001)    (AI-002)    (AI-003, takes complaint history)
     │          │              │
     └──────────┴──────┬───────┘
                       ▼
      AIAnalysisRepository → complaint_ai_analysis row
      (structured columns + decision_intelligence JSON
       + complaint_intelligence JSON)
                       ▼
      GET /complaints/{id} → Complaint Details UI
```

Key pieces:

- **Provider contract** — `CortexaProvider` defines `analyze()`, `decide()`,
  and `intelligence()`. Dataclasses (`CortexaAnalysis`, `CortexaDecision`,
  `CortexaIntelligence`, `ComplaintSignal`) are the only currency between the
  provider and the rest of the system.
- **Factory** — `get_cortexa_provider()` resolves the provider from the
  `CORTEXA_PROVIDER` setting. Adding a provider = register it in the factory.
- **Heuristic V1** — `HeuristicCortexaProvider` (`cortexa-heuristic` /
  `rules-v1`): deterministic, dependency-free, no external calls. It exists so
  the full pipeline ships and is testable before any LLM is wired in.
- **Separation of data and logic** — the service supplies historical
  complaint signals (data access); the provider does the scoring (logic). A
  future vector retriever can supply the same `ComplaintSignal` shape without
  changing the provider contract.

## Current Capabilities

### AI-001 — Understanding Engine ✅ Implemented

*"What happened?"* — turns raw text into structured understanding:

category, company, product, department, location, sentiment, emotion,
severity, priority, summary, language, confidence score, and derived named
entities. Stored as typed columns on `complaint_ai_analysis`.

### AI-002 — Decision Intelligence ✅ Implemented

*"So what should the business do?"* — consumes the AI-001 analysis and
produces: executive summary, business impact list, recommended department
(primary / secondary / optional), recommended actions, actionability level
(Low → Very High), and reasoning. Stored in the `decision_intelligence` JSON
column.

### AI-003 — Complaint Intelligence ✅ Implemented

*"Has this happened before? Is it getting worse? Should someone act?"* —
compares the complaint against stored history and produces:

- **Similar complaint count** and **similarity confidence** (0–100)
- **Trend** — Increasing | Stable | Decreasing | Unknown (recent 30-day
  window vs. the prior window)
- **Pattern** — e.g. "Repeated battery failures", "Possible manufacturing
  defect"
- **Risk level** — Low | Medium | High | Critical, weighing frequency,
  severity, actionability, and recurrence
- **Executive insight** — narrative explanation of what the recurrence means
- **Business recommendation** — ordered actions (escalate, investigate,
  monitor, notify)
- **Relationship health score** (0–100) with contributing reasons

Similarity V1 is deterministic — weighted signals (product 0.40 / company
0.20, category 0.25, department 0.10, keyword Jaccard 0.25) with a 0.45
match threshold. No vectors, no embeddings, no external dependencies. The
provider contract is embedding-ready: swapping in semantic retrieval changes
nothing above the provider layer. Stored in the `complaint_intelligence`
JSON column.

## Future Layers (Planned — not implemented)

| Layer | Question it answers |
| --- | --- |
| **Recommendation Intelligence** (AI-004) | "What exactly should this organization do, in its own vocabulary of teams and playbooks?" |
| **Predictive Intelligence** (AI-005) | "What will happen next — escalation, churn, repeat failure — and with what likelihood?" |
| **Executive Intelligence** (AI-006) | "What does leadership need to see this week?" — the dashboard layer of Principle #3. |
| **Learning Engine** (AI-007) | "Was Cortexa right?" — feedback loops that improve every layer from outcomes. |

Each future layer must extend the same provider contract, and each must pass
the Golden Question (see `PROJECT_PRINCIPLES.md`) before it ships.
