# ComplaintMe AI — Architecture (Current Implementation)

> Describes the system as it exists today. For design-phase intent see the
> root-level `ARCHITECTURE.md`; for the AI layer in depth see
> [`CORTEXA.md`](CORTEXA.md).

---

## System Overview

ComplaintMe AI is a **modular monolith** with an API-first backend and a
single-page premium frontend.

```
        Frontend  (Next.js 15, React 19, Tailwind 4, framer-motion)
            │  fetch + Supabase bearer token   frontend/src/lib/api.ts
            ▼
        FastAPI  (backend/app/main.py, /api/v1)
            │  routers → dependencies → services
            ▼
        Complaint Engine  (services + repositories)
            │  create / list / detail / update / soft-delete
            │  background task per new complaint
            ▼
        Cortexa Provider Layer  (backend/app/ai/)
            │  analyze() → decide() → intelligence()
            ▼
        PostgreSQL  (SQLAlchemy 2 async + asyncpg, Alembic migrations)
```

### Backend layout

```
backend/app/
├── main.py            FastAPI app, CORS, router mounting
├── core/config.py     pydantic-settings (env-driven), CORTEXA_PROVIDER switch
├── api/
│   ├── deps.py        DI: DB session, services, current user id
│   └── v1/            complaints.py, health.py, router.py
├── auth/              Supabase JWT verification scaffolding
├── db/                Base, async session, models (models.py, complaint.py)
├── repositories/      complaint.py, ai_analysis.py — all SQL lives here
├── services/          complaint.py (CRUD), cortexa.py (analysis pipeline)
├── schemas/           Pydantic request/response models
└── ai/                base.py (contract), heuristic.py (V1 provider),
                       decision.py, intelligence.py, factory.py
```

### Data model (4 tables)

- **complaints** — user_id, organization_id (multi-tenant-ready), title,
  description, current_status, timestamps, `deleted_at` soft delete.
- **complaint_ai_analysis** — one row per analysis run: provider/model
  identity, AI-001 structured columns (category, company, product, sentiment,
  severity, …), plus two additive JSON columns: `decision_intelligence`
  (AI-002) and `complaint_intelligence` (AI-003).
- **attachments**, **complaint_status_history** — schema in place for
  upcoming features.

---

## The Provider Pattern

All AI flows through one abstract contract:

```python
class CortexaProvider:                       # backend/app/ai/base.py
    async def analyze(text) -> CortexaAnalysis                    # AI-001
    async def decide(text, analysis) -> CortexaDecision           # AI-002
    async def intelligence(text, analysis, decision,
                           history, created_at) -> CortexaIntelligence  # AI-003
```

`get_cortexa_provider()` (`factory.py`) resolves the implementation from the
`CORTEXA_PROVIDER` setting; the only implementation today is
`HeuristicCortexaProvider` (`heuristic`, the default).

**Why providers exist:**

1. **Swappability** — moving from the heuristic engine to OpenAI, Anthropic,
   or a local model is a factory registration plus an env-var flip. No
   service, API, schema, or frontend change.
2. **Testability** — the pipeline is fully exercisable offline and
   deterministically, with zero API keys or network access.
3. **Boundary discipline** — dataclasses (`CortexaAnalysis`,
   `CortexaDecision`, `CortexaIntelligence`, `ComplaintSignal`) are the only
   types that cross the boundary. No vendor SDK types leak upward.
4. **Data/logic separation** — the service fetches complaint history
   (data access); the provider scores it (logic). A future vector retriever
   can supply the same `ComplaintSignal` shape without a contract change.

## Why BackgroundTasks

Complaint creation returns **immediately**; Cortexa runs afterward via
FastAPI's `BackgroundTasks` (`analyze_complaint_task`).

- The submit experience is never blocked by analysis latency — critical once
  a real LLM (seconds, retries) replaces the heuristic (microseconds).
- The UI embraces the asynchrony: the detail page shows an "analyzing" state
  and polls until the analysis lands.
- No new infrastructure (no Celery, no Redis, no queue) was needed for V1 —
  consistent with the no-unnecessary-dependencies principle.
- The trade-off is accepted and documented: tasks are in-process and are lost
  if the server dies mid-analysis. A durable queue is the designated upgrade
  path when scale demands it (see `DECISIONS.md`).

## Why JSON Payloads for Evolving AI Intelligence

AI-001 fields are stable, typed columns. AI-002 and AI-003 outputs live in
nullable **JSON columns** (`decision_intelligence`, `complaint_intelligence`).

- **AI output shapes evolve fast.** Each new intelligence layer would
  otherwise mean wide, churning migrations. A JSON payload makes each layer
  one additive nullable column.
- **Never break existing functionality.** Nullable + additive means old rows
  and old clients keep working; pre-AI-002 analyses simply render the
  "pending" state.
- **Read pattern fits.** Intelligence is read whole per complaint, not
  filtered/aggregated per field in SQL. When a field needs indexing or
  aggregation (e.g. risk level for the executive dashboard), that field gets
  promoted to a real column at that point.
- Pydantic schemas (`DecisionIntelligenceResponse`,
  `ComplaintIntelligenceResponse`) re-impose typing at the API edge, so the
  frontend consumes fully typed shapes regardless of storage.

## Frontend Architecture

- **Routes** — `(auth)` group (login, register, forgot-password),
  `/dashboard`, `/complaints/[id]`.
- **API client** — `frontend/src/lib/api.ts`: one thin fetch wrapper, typed
  against the backend schemas, attaching the Supabase session token as a
  Bearer credential.
- **Complaint workspace** — `components/complaints/complaint-workspace.tsx`
  renders the pipeline output: original complaint, Cortexa analysis (AI-001),
  Decision Intelligence (AI-002), Complaint Intelligence (AI-003), and an
  animated pipeline timeline. Polls until background analysis completes.
- **Design system** — shared `ui/` primitives (Badge, Button, Skeleton),
  glass-card surfaces, brand tone tokens, framer-motion state transitions.

## Authentication (Current State)

Supabase owns identity on the frontend (register, login, forgot-password are
implemented and the client sends real bearer tokens). Backend JWT
verification is scaffolded (`app/auth/`) but **not yet enforced** — API
dependencies currently resolve a placeholder user id. Completing
verification is tracked as AUTH-002 and requires no API shape changes.

## Extension Points

| To add… | Touch… | Nothing else changes |
| --- | --- | --- |
| A real LLM provider | New class in `app/ai/`, register in `factory.py`, set `CORTEXA_PROVIDER` | Services, APIs, schemas, frontend |
| Embedding-based similarity | Provider internals + history retrieval | `intelligence()` signature, JSON shape |
| A new intelligence layer (AI-004+) | New provider method + dataclass, one nullable JSON column, one response schema, one UI section | Existing columns, endpoints, consumers |
| Durable background processing | Swap `BackgroundTasks` call site in `api/v1/complaints.py` for a queue producer | The analysis service itself |
| Backend auth enforcement | Implement `verify_supabase_jwt`, wire `get_current_user_id` | API shapes, frontend |
| A new API domain | Router in `api/v1/` + service + repository | Existing modules |
