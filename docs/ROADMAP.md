# ComplaintMe AI — Roadmap

> Status legend: ✅ Completed · 🔄 In progress · 📋 Planned (not started —
> scope may change).

---

## Completed ✅

### AUTH — Authentication Foundation

- Supabase authentication configured (frontend)
- Login, registration, and forgot-password pages
- Backend JWT verification scaffolding and protected-route dependencies

### CMP — Complaint Engine

- Database models: complaints, AI analysis, attachments, status history
  (Alembic migrations)
- Complaint CRUD API: create, list, detail, update, soft delete
- End-to-end complaint submission from the dashboard

### UI — Premium Experience

- Premium dashboard (recent complaints, submission surface)
- Cortexa Intelligence Workspace — the complaint details page with analysis,
  decision intelligence, complaint intelligence, and pipeline timeline

### AI — Cortexa Intelligence Layers

- **AI-001 Understanding Engine** — structured extraction: category, company,
  product, sentiment, emotion, severity, priority, summary, confidence
- **AI-002 Decision Intelligence** — executive summary, business impact,
  recommended department and actions, actionability, reasoning
- **AI-003 Complaint Intelligence** — similar-complaint count and confidence,
  trend, pattern detection, risk level, executive insight, business
  recommendation, relationship health score

---

## Current 🔄

### AI-QA Validation Sprint

Systematic validation of the three shipped intelligence layers: accuracy of
heuristic extraction, quality of decision output, correctness of similarity /
trend / risk logic across edge cases, and automated test coverage for the
pipeline.

---

## Future 📋 (Planned — not implemented)

### AI-004 — Recommendation Intelligence

Organization-aware recommendations: map Cortexa's generic advice onto the
organization's own teams, playbooks, and escalation paths.

### AI-005 — Predictive Intelligence

Forecasting: escalation likelihood, resolution-time estimates, churn risk,
and early-warning signals from complaint velocity.

### AI-006 — Executive Dashboard

The aggregation layer of Cortexa Principle #3: portfolio-level trends, risk
heatmaps, and weekly executive intelligence across all complaints.

### AI-007 — Learning Engine

Feedback loops: capture outcomes (was the risk real? was the action taken?)
and use them to improve every layer.

### Platform (candidate work, unscheduled)

- Backend JWT enforcement (complete AUTH-002)
- Hosted LLM provider (OpenAI / Anthropic / local) behind the existing
  provider contract
- Embedding-based similarity retrieval for AI-003
- Durable background processing (queue) when scale requires it
- Multi-tenancy activation on the existing `organization_id` model

Planned items describe intent, not commitment — each must pass the Golden
Question before implementation begins.
