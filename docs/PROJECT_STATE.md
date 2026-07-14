# ComplaintMe AI — Project State

> Snapshot as of **2026-07-14**. Read this first: it should give a new
> engineer the whole picture in under five minutes.

---

## Project Summary

ComplaintMe AI is an AI-powered **Complaint Intelligence Platform**. A user
describes a complaint in plain language; **Cortexa**, the intelligence
engine, turns it into structured understanding (AI-001), decision support
(AI-002), and cross-complaint intelligence — has this happened before, is it
getting worse, should someone act (AI-003). The product is decision quality,
not ticket management.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, framer-motion, lucide-react |
| Auth | Supabase (`@supabase/supabase-js`) — identity on the frontend; backend JWT verification scaffolded |
| Backend | FastAPI (Python 3.12), Pydantic v2, pydantic-settings |
| Data | PostgreSQL, SQLAlchemy 2 (async, asyncpg), Alembic |
| AI | Cortexa provider layer — deterministic heuristic V1 (`cortexa-heuristic` / `rules-v1`), zero external AI dependencies |
| Tooling | ruff (backend lint), ESLint 9 (frontend), Docker Compose (Postgres) |

## Current Features

- Register / login / forgot-password (Supabase, frontend)
- Submit a complaint from the dashboard with one free-text field
- Dashboard with recent complaints
- Complaint CRUD API (create, list, detail, update, soft delete) under `/api/v1`
- Automatic background Cortexa analysis on every new complaint
- Complaint Details workspace showing the full intelligence stack:
  original complaint, structured analysis, decision intelligence, complaint
  intelligence, animated pipeline timeline — with graceful
  "analyzing…" states and polling until results land

## Completed Milestones

1. **AUTH** — Supabase auth foundation + auth pages
2. **CMP** — complaint data model and CRUD engine
3. **UI** — premium dashboard and intelligence workspace
4. **AI-001** — Understanding Engine
5. **AI-002** — Decision Intelligence
6. **AI-003** — Complaint Intelligence

## Current AI Capabilities

For every complaint, Cortexa produces and stores (one
`complaint_ai_analysis` row):

- **Understanding** — category, company, product, department, location,
  sentiment, emotion, severity, priority, summary, language, confidence
- **Decision** — executive summary, business impact, recommended department
  (primary/secondary/optional), recommended actions, actionability, reasoning
- **Intelligence** — similar count, similarity confidence (0–100), trend
  (Increasing/Stable/Decreasing/Unknown), pattern, risk level
  (Low/Medium/High/Critical), executive insight, business recommendations,
  relationship health score (0–100) with reasons

All of it comes from the deterministic heuristic provider — **no LLM is wired
in yet**. Quality is rule-bound; the provider contract is designed so an LLM
provider can replace it without any API change.

## Known Limitations

- **Backend auth not enforced** — API dependencies resolve a placeholder user
  id; Supabase JWT verification (AUTH-002) is scaffolded but not implemented.
  Do not expose the backend publicly yet.
- **Heuristic intelligence only** — extraction accuracy is limited to the
  rule vocabulary (e.g., unrecognized categories fall back to "General
  Complaint").
- **Similarity is lexical/deterministic** — no embeddings; paraphrased
  complaints with disjoint vocabulary may not match.
- **In-process background tasks** — an analysis is lost if the server dies
  mid-run; there is no retry or queue.
- **Single-tenant in practice** — `organization_id` exists but nothing sets
  or scopes by it.
- **Attachments and status history** — tables exist; no feature uses them.

## Testing Status

- **No automated test suite yet** (pytest is configured; `backend/tests/`
  does not exist). This is the main gap the AI-QA sprint addresses.
- Current verification is manual + tooling: `ruff check .`, `npm run lint`,
  `npm run build`, and scripted end-to-end smoke tests of the
  analyze → decide → intelligence pipeline.

## Current Priorities

1. **AI-QA Validation Sprint** — systematic validation and automated tests
   for AI-001/002/003
2. Backend JWT enforcement (close AUTH-002)
3. Foundation for AI-004 Recommendation Intelligence

## Next Sprint

**AI-QA Validation Sprint** — build the pytest suite around the Cortexa
pipeline (unit tests per engine, similarity/trend/risk edge cases,
API-level pipeline tests), then baseline heuristic accuracy so a future LLM
provider can be judged against it.
