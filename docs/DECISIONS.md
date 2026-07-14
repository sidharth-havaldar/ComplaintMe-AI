# ComplaintMe AI — Architecture Decision Records

> Significant, hard-to-reverse decisions and why they were made. Newest last.
> Statuses: **Accepted** (in force) · **Superseded** (replaced — kept for
> history).

---

## ADR-001 — Modular Monolith over Microservices

**Decision.** One FastAPI application with strict internal layering
(routers → services → repositories → providers), not a set of services.

**Reason.** A small team shipping an MVP needs one deployable, one migration
history, and zero inter-service plumbing. Layer discipline preserves the
option to extract services later.

**Alternatives.** Microservices (operational overhead with no current
benefit); unlayered monolith (fast at first, unmaintainable at the pace AI
features evolve).

**Status.** Accepted.

## ADR-002 — Supabase for Identity

**Decision.** Supabase owns registration, login, sessions, and password
reset. The backend's job is only to *verify* Supabase-issued JWTs.

**Reason.** Authentication is undifferentiated heavy lifting; the product is
complaint intelligence. Supabase gives production-grade auth with a hosted
dashboard, letting effort go to Cortexa.

**Alternatives.** Custom FastAPI auth (weeks of security-critical work);
Auth0/Clerk (comparable, but Supabase also provides Postgres tooling and a
generous free tier).

**Status.** Accepted. Backend-side verification (AUTH-002) is scaffolded and
pending — see `PROJECT_STATE.md` Known Limitations.

## ADR-003 — Cortexa Provider Abstraction

**Decision.** Every AI capability is a method on the abstract
`CortexaProvider` contract (`analyze`, `decide`, `intelligence`), resolved by
a factory from the `CORTEXA_PROVIDER` setting. Plain dataclasses are the only
types crossing the boundary; no vendor SDK types leak upward.

**Reason.** AI providers must remain swappable (development principle #3).
Model choice is a config decision, not an architecture decision — moving to
OpenAI/Anthropic/local models must never require touching services, APIs, or
the frontend. It also makes the whole pipeline testable offline.

**Alternatives.** Direct LLM SDK calls in services (fast, then vendor
lock-in everywhere); LangChain or similar (heavy dependency and abstraction
churn for what is, today, three well-typed calls).

**Status.** Accepted.

## ADR-004 — Deterministic Heuristic Engine as V1 Provider

**Decision.** Ship the first provider (`cortexa-heuristic` / `rules-v1`) as
deterministic rule-based logic — keyword extraction, weighted similarity
scoring, windowed trend detection — with zero external AI dependencies.

**Reason.** It proves the entire pipeline (API → background analysis →
storage → UI) end to end with no API keys, no cost, no latency, and fully
reproducible outputs. "Intelligence over complexity": answer the business
question now, upgrade the internals later behind the same contract.

**Alternatives.** Wait for LLM integration (blocks every downstream ticket);
mock providers only (nothing real to demo or validate).

**Status.** Accepted — designated for replacement by an LLM provider via
ADR-003, with the heuristic retained as a fallback and test baseline.

## ADR-005 — FastAPI BackgroundTasks for Analysis

**Decision.** Cortexa analysis runs in a FastAPI `BackgroundTask` after the
create-complaint response is sent — not synchronously, and not on a queue.

**Reason.** Submission must never block on analysis (an LLM provider will
take seconds and may retry). BackgroundTasks achieves that with zero new
infrastructure. The UI is built for the asynchrony: an "analyzing" state
polls until the result lands.

**Alternatives.** Synchronous analysis (couples UX to model latency); Celery
/ RQ / Arq with Redis (durability and retries, at the cost of infrastructure
the MVP doesn't need yet).

**Status.** Accepted. Known trade-off: in-process tasks are lost on server
death. A durable queue is the planned upgrade when scale or an SLA demands
it; the swap point is a single call site.

## ADR-006 — JSON Columns for Evolving AI Payloads

**Decision.** Stable AI-001 fields are typed columns; each subsequent
intelligence layer is one additive nullable JSON column
(`decision_intelligence` for AI-002, `complaint_intelligence` for AI-003).
Pydantic response schemas re-impose typing at the API edge.

**Reason.** Intelligence shapes evolve with every layer; JSON keeps each new
layer a one-column additive migration and keeps old rows/clients valid
("never break existing functionality"). Payloads are read whole per
complaint, so relational decomposition buys nothing today.

**Alternatives.** Fully normalized tables per layer (migration churn, join
fan-out); one giant JSON blob for everything (loses indexing/typing on the
stable AI-001 fields); separate document store (second database for no
reason).

**Status.** Accepted. Promotion rule: when a JSON field needs SQL-level
filtering or aggregation (e.g. risk level on an executive dashboard), promote
that field to a real column then.

## ADR-007 — UI-First MVP

**Decision.** Build the premium end-to-end experience (dashboard, submission,
intelligence workspace) early — including polished "analyzing…" and
placeholder states for intelligence that didn't exist yet.

**Reason.** The product thesis is that AI output *presented well* changes
decisions. A UI-first approach validated the experience, forced API contracts
to be consumer-shaped, and meant each AI layer (001→003) became visible the
day it shipped — the workspace was already waiting for the data.

**Alternatives.** Backend-first (risks building intelligence nobody can
consume); parallel-everything (coordination overhead for a small team).

**Status.** Accepted.

## ADR-008 — Deterministic Similarity for AI-003 (No Embeddings)

**Decision.** Cross-complaint similarity V1 uses weighted deterministic
signals — product match 0.40 / company 0.20, category 0.25, department 0.10,
keyword Jaccard 0.25, threshold 0.45 — computed over history the *service*
supplies as `ComplaintSignal` records.

**Reason.** No vector database, no embedding calls, no new dependencies —
and results are explainable ("matched on product + category"), which suits a
decision-support product. Splitting retrieval (service) from scoring
(provider) means embeddings can replace the internals later with no API
change.

**Alternatives.** pgvector + embeddings (better recall on paraphrase, but a
new dependency and cost before validating the intelligence layer); external
vector DB (heavier still).

**Status.** Accepted — explicit upgrade path to embedding retrieval behind
the same contract.
