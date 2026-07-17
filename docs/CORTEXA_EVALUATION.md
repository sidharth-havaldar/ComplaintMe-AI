# Cortexa Quality Evaluation (QA-001)

**Date:** 2026-07-17
**Dataset:** `data/evaluation/complaints.json` (cortexa-evaluation-v1, n=100)
**System under test:** `cortexa-heuristic` / `rules-v1` / `cortexa-v1` — the full V1 pipeline:
`analyze_text` (AI-001) → `derive_decision` (AI-002) → `derive_intelligence` (AI-003)
**Harness:** `data/evaluation/run_eval.py` (per-item output in `data/evaluation/results.json`)
**Scope:** Measurement only. No heuristics were changed.

Complaint intelligence (AI-003) was exercised two ways: with an empty history
("first complaint ever") and with the other 99 evaluation complaints as the
history corpus. Scoring is strict field equality (case-insensitive); a lenient
score additionally accepts the alternates documented in each item's `notes`.

---

## 1. Scoreboard

| Section | Score | Basis |
|---|---|---|
| Company detection | **39/100** (2/10) | exact match incl. null==null; only 21 true detections |
| Product detection | **91/100** (5/10)* | 89 of the 91 hits are null==null; only 2/11 real products found |
| Category | **46/100** strict, 50 lenient (4/10) | first-match keyword rules |
| Department | **49/100** (4/10) | fully coupled to category; no independent signal |
| Sentiment | **58/100** (4/10) | 30 Negative complaints read as Neutral; 4 sarcastic ones as Positive |
| Severity | **55/100** (3/10) | 21 of 34 High-severity items missed |
| Priority | **53/100** (3/10) | pure echo of severity; all 6 deadline-elevation cases missed |
| Executive Summary | (2/10) | 27 unique strings across 100 complaints; correct category **and** subject in only 11 |
| Decision Intelligence | (3/10) | only 6/35 expected-High-priority items rated High/Very-High actionability |
| Complaint Intelligence | (2/10) | 96/100 complaints found **zero** similar items in a 99-complaint corpus; trend "Unknown" for all 100 |

\* The raw product number is misleading — see §2.2.

### Accuracy by difficulty

| Field | easy (34) | medium (31) | hard (22) | ambiguous (13) |
|---|---|---|---|---|
| company | 11 | 11 | 6 | 11 |
| product | 31 | 27 | 20 | 13 |
| category | 19 | 15 | 5 | 7 |
| department | 19 | 17 | 6 | 7 |
| sentiment | 23 | 19 | 11 | 5 |
| severity | 25 | 21 | 8 | 1 |
| priority | 24 | 20 | 8 | 1 |

The headline: Cortexa is not merely weak on hard/sarcastic items — it gets barely
half of the **easy** items right on category, and only a third on company.

---

## 2. Section-by-section findings

### 2.1 Company detection — 39/100, only 21 real detections

- Of the 39 "correct" answers, **18 are null==null** (the dataset expected no
  company and Cortexa found none). Only **21 of 82** named companies were
  actually detected. 60 were missed outright; 1 was wrong (`Uber Eats` → `Uber`).
- Root cause: `_KNOWN_BRANDS` in `backend/app/ai/heuristic.py:20` is a ~30-entry
  hardcoded lexicon skewed to electronics and Indian consumer apps. Whole
  industries have **zero coverage**: Banking (HDFC, SBI, Chase, ICICI, Axis, BofA,
  Wells Fargo), Insurance (LIC, Star Health, ICICI Lombard, Bajaj Allianz…),
  Healthcare, Hotels, Airlines, Government, Education — 7 of 11 industries
  cannot produce a single company hit.
- Detection is single-token, so multi-word names ("Bank of America", "Star
  Health", "Delhi Public School") are unreachable even if added naively.
- The only implicit-brand resolutions that work are the ones hardcoded
  (`pixel`→Google, `redmi`→Xiaomi). There is no capitalized-proper-noun
  fallback, so "Marriott charged me…" yields nothing despite the obvious cue.

### 2.2 Product detection — 91/100 nominal, ~18% real recall

- 89 of the 91 hits are trivially correct nulls (dataset has 89 null products).
  Of the **11 real products, only 2 were found** (`Samsung Galaxy S23`,
  `OnePlus 12`).
- `Pixel 8` was found but not canonicalized (`Pixel 8` vs expected
  `Google Pixel 8`) — brand resolution and product surface-form disagree.
- Products without a digit/model-word suffix are invisible: `Dell XPS 15`
  (XPS not in `_MODEL_WORDS`, no digit in "XPS"), `Sony WH-1000XM5`,
  `iCloud+` (`+` breaks the token regex), `Lenovo ThinkPad`, `Redmi Note 13`
  ("Redmi" maps to company Xiaomi but "Note 13" isn't picked up because
  detection starts at the *brand* token and "Redmi" is consumed as company),
  `LG TV` (LG not a known brand), `IKEA PAX`, `Coursera Plus`.
- Zero false positives — the detector is precise but nearly blind.

### 2.3 Category — 46/100 strict (50 lenient)

Per-category recall against ground truth:

| Expected category | Recall | Note |
|---|---|---|
| Billing Issue | 21/27 | the only strong category |
| General Complaint | 5/6 | mostly by fallback, not by recognition |
| Service Quality | 9/21 | keyword set ("rude", "staff", "waited") too narrow |
| Product Failure | 4/8 | |
| Delivery Issue | 4/8 | |
| Account Issue | 3/9 | |
| Warranty Claim | 0/1 | |
| **Safety Concern** | **0/9** | label absent from V1 taxonomy |
| **Fraud & Security** | **0/4** | absent |
| **Claim Dispute** | **0/3** | absent |
| **Booking & Reservation** | **0/2** | absent |
| **Baggage Issue** | **0/1** | absent |
| **Data Privacy** | **0/1** | absent |

- **20/100 items expect labels the V1 taxonomy cannot emit at all** — a hard
  ceiling of 80% before any keyword quality is considered. These are exactly
  the highest-stakes categories (fraud, safety, privacy).
- **First-match-wins rule ordering causes systematic hijacking:**
  - "Product Failure" contains the bare keywords `fire`, `smoke`, `stopped`,
    `failed` — so a charger fire (eval-002), in-flight smoke (eval-054), and
    even "a failed money transfer" (eval-015) all become Product Failure.
  - "Warranty Claim" contains bare `replacement`/`replace` — a shattered
    Amazon delivery asking for "a replacement" (eval-065) becomes Warranty Claim.
  - "Delivery Issue" fires on the word `delivered` anywhere — an LG TV with a
    cracked panel (eval-009) and a food-delivery pricing question (eval-082)
    both misroute.
  - "Billing Issue" fires on `payment`/`transaction` even when the substance is
    account access ("can't pay my rent" → eval-014 works by luck; "crashes at
    the payment step" eval-079 → Billing).
- **General Complaint is the real modal output (31/100 predicted)** — 26 of
  those were wrong. Claim disputes ("rejected my claim"), safety hazards, rude
  government staff, and hotel complaints all fall through to the fallback
  because the keyword lists never mention claims, hazards, bookings, baggage
  or harassment.
- Category matching is substring-based on lowered text, e.g. `"fire"` also
  matches inside other words, and the single first hit wins with no scoring of
  competing evidence.

### 2.4 Department — 49/100

- Department is a **pure function of category** (each rule carries its
  department), so its errors are the category errors plus label mapping.
  The dataset's newer departments (Safety & Compliance, Fraud & Security,
  Privacy Office, Claims, Reservations, Baggage Services) are unreachable.
- It scores 3 points above category only because Product Failure and General
  Complaint share "Customer Support", masking three category misses.
  There is no independent routing intelligence to evaluate.

### 2.5 Sentiment — 58/100

- **The dominant failure is not sarcasm — it's plain negativity read as
  Neutral (30 cases, 23 of them easy/medium).** The word-set vote
  (`_NEGATIVE_WORDS` vs `_POSITIVE_WORDS`) requires strictly more negative
  than positive *unique token* matches. Complaints written in a factual,
  measured register ("charged me twice… I want both reversed") often contain
  zero lexicon words and default to Neutral. Examples: eval-002 (charger
  fire!), eval-013, eval-052, eval-085, eval-092.
- **Sarcasm inverts to Positive in 4 hard cases** (eval-018, eval-036,
  eval-053, eval-062): "fantastic", "world-class", "great", "thanks" outvote
  the absent negative vocabulary. eval-053 (14-hour layover) reads *Positive*.
- Neutral→Negative in 7 ambiguous items: politely-phrased questions trip
  single lexicon words (`not`, `issue`, `problem`, `wrong`), so "Not angry,
  just wondering" scores Negative.
- Set-based counting means repetition carries no weight ("rude… rude… rude"
  counts once), and `not` is unconditionally negative ("not the end of the
  world" → negative evidence).
- Emotion tracks the same weakness: every sarcastic miss also produced
  emotion "Neutral", so the downstream decision layer's churn-risk logic
  (`_business_impact` keying on Anger) never triggers for the angriest texts.

### 2.6 Severity & Priority — 55/100 and 53/100

- **21 of the 34 expected-High items were scored below High.**
  Safety incidents phrased calmly sail through: wrong medication dispensed
  (eval-031), loose third-floor railing (eval-045), in-flight smoke —
  wait, eval-054 hits only because the literal word "smoke" is in
  `_HIGH_SEVERITY_WORDS`; the missed-heart-blockage narrative (eval-035),
  hostel extortion (eval-099), mass Aadhaar data exposure (eval-089) all
  score **Medium**. Severity is keyword presence, not impact reasoning.
- The High-severity word list also causes false Highs: `"completely"`
  ("room was filthy… completely" eval-038, "crashes… completely" patterns)
  and `"security"` ("security deposit" eval-042, "security guard" eval-071)
  are far too generic — 5 Medium items were inflated to High by these.
- Ambiguous items expose the missing Low path: 17 expected-Low items scored
  Medium because `_LOW_SEVERITY_WORDS` ("minor", "cosmetic", "scratch") almost
  never appears in real hedged text ("Not sure this even counts…"). Ambiguous
  severity accuracy: **1/13**.
- **Priority is an echo of severity** (`_detect_priority` = severity ±
  urgency words). All 6 dataset items where priority should exceed severity
  due to a deadline ("I fly in 18 hours", "credit card bill due in three
  days", "doctor's appointment is on Friday") were missed — there is no
  deadline/temporal detection at all.

### 2.7 Executive Summary — template with two blanks

- The analysis summary is a single template
  (`"Customer reports a {category} involving {subject}."`) and the decision
  executive summary appends one canned framing sentence per category.
  Across 100 distinct complaints, there are only **27 unique summaries**.
- Quality decomposes as: correct category **and** real subject — **11**;
  correct category but generic subject ("the reported product or service") —
  35; wrong category with a subject — 11; wrong on both — **43**.
- Because subject = product-or-company and company detection is 21/82, the
  majority of summaries say a customer "reports a general complaint involving
  the reported product or service" — zero information for an executive.
  Nothing from the complaint itself (amounts, durations, what actually broke,
  what the customer wants) ever reaches the summary.

### 2.8 Decision Intelligence — right shape, wrong inputs, no text awareness

- `derive_decision` consumes **only** the structured analysis, never the text.
  Every input error propagates at full strength: 26 wrongly-"General"
  complaints get the generic playbook ("contact the customer to clarify…")
  even when the complaint is a documented fraud with a police report
  (eval-063 gets Account Issue → Technical Support playbook; eval-072's
  counterfeit-goods case gets the *default* playbook).
- **Actionability anti-correlates with real urgency.** Of the 35 items with
  expected priority High, only 6 were rated High/Very-High actionability;
  **14 were rated Low** — because actionability is driven by
  product-presence, and high-stakes service/fraud/safety complaints rarely
  name a product. A dead phone with a model number outranks a life-threatening
  allergen failure (eval-081: severity read Medium, no company → Low).
- The playbooks themselves are reasonable but static: recommended actions are
  identical for every complaint in a category, never citing specifics
  (amounts, order numbers, deadlines) that are present in the text.
- One useful behaviour confirmed: the "ask the customer for the specific
  product" action correctly appears when product is missing, and the
  reasoning strings are honest about what was and wasn't identified.

### 2.9 Complaint Intelligence — effectively inert

- With the other 99 complaints as history, **96/100 complaints matched zero
  similar complaints**; the max was 1. The two genuine ground-truth clusters
  (Airtel billing ×2, Zomato billing ×2) were found — but so were two spurious
  cross-company pairs (eval-057↔060 works, but eval-075↔078 matched partly on
  shared category alone).
- Root causes compound: similarity needs 0.45, but company match gives only
  0.20 and company detection misses 73% of companies — so the biggest
  weighted component (product exact-match, 0.40) is almost always 0, and
  token Jaccard between different 40-word complaints rarely exceeds 0.1.
  Category match (0.25) is itself only 46% accurate.
- **Trend is "Unknown" for all 100 items** (needs ≥2 similar), pattern is
  "No recurring pattern detected yet." for 96, and `_COMPONENTS` is an
  electronics-only list (battery, screen, charger…) that can never describe a
  billing, claims or safety pattern.
- Meanwhile **risk and health swing on the single complaint alone**: risk was
  Medium for 57 and High for 7 items with *zero* recurrence, and health
  dropped to 66 for a lone warranty phone complaint — so the cross-complaint
  layer emits confident-looking scores that encode no cross-complaint signal.
  The executive insight is the same isolated-complaint sentence 96 times.

### 2.10 Confidence (observed, unscored)

- Confidence is roughly calibrated in rank (0.5-bucket → 25% field accuracy,
  0.8-bucket → 76%) but the *floor is far too high*: minimum 0.45, mean 0.65,
  and wrong-category items average 0.62 — the UI will show ~"65% confident"
  on analyses that are mostly wrong.

---

## 3. Recurring weaknesses (cross-cutting)

1. **Closed-world lexicons in an open world.** Company, product, category,
   component and emotion all depend on small hardcoded lists tuned to
   electronics + Indian apps. 7/11 industries have zero company coverage;
   6/13 dataset categories are unreachable.
2. **First-match-wins with no evidence weighing.** One incidental keyword
   ("replacement", "delivered", "payment", "fire") routes the entire
   complaint; competing signals are never compared.
3. **Keyword presence ≠ meaning.** Severity, sentiment and urgency are all
   surface-word tests, so calm descriptions of grave harm score Medium/Neutral
   while generic words ("completely", "security") inflate trivia to High.
4. **No tone/register handling.** Sarcasm reads as Positive; measured factual
   complaints read as Neutral; hedged questions read as Negative.
5. **Error propagation down the chain.** Decision and intelligence layers
   consume only the (46%-accurate) structured analysis; every upstream miss is
   amplified into wrong playbooks, wrong actionability and empty similarity.
6. **Product-centric bias.** Actionability, similarity weighting, components
   and patterns all assume a physical product; service, financial, government
   and safety complaints — most of the dataset — are structurally
   second-class.
7. **No temporal/deadline awareness.** Amounts, dates, elapsed durations and
   imminent deadlines (the strongest priority signals in the dataset) are
   never extracted or used.
8. **Templated language masquerading as intelligence.** 27 unique summaries
   for 100 complaints; identical action lists per category; the same
   "isolated complaint" insight 96 times. The output *looks* analytical while
   carrying almost no complaint-specific content — the opposite of the
   Cortexa "So what?" principle.
9. **Similarity threshold unreachable by design.** The scoring weights depend
   on the very fields (company/product/category) the analyzer gets wrong, so
   cross-complaint intelligence silently degrades to noise.
10. **Overconfident floor.** Confidence starts at 0.40 and only climbs; there
    is no path to "we don't know", even for the 43 summaries wrong on both
    dimensions.

---

## 4. Top 10 improvements (recommendations only — not implemented)

1. **Expand the taxonomy to the full label space** — add Safety Concern,
   Fraud & Security, Claim Dispute, Booking & Reservation, Baggage Issue and
   Data Privacy (with their departments). This alone removes a hard 20-point
   ceiling on category/department and covers the highest-stakes complaints.
2. **Replace first-match category routing with weighted scoring** — score all
   categories on keyword evidence (phrase > word, multiple hits > one),
   demote ambiguous single-word triggers (`fire`, `delivered`, `replacement`,
   `payment`), and pick the max with a margin-based General fallback.
3. **Company detection: multi-word gazetteer + proper-noun fallback** —
   per-industry brand gazetteer with multi-token matching ("Bank of America",
   "Star Health"), plus a capitalized-sequence heuristic near verbs like
   "charged/billed/cancelled" for unknown brands, preserving canonical-name
   mapping (Pixel→Google) and marketplace-vs-brand rules (eval-072).
4. **Severity from impact signals, not word lists** — detect impact classes
   (physical harm/health, financial loss with amounts, data exposure, legal/
   police involvement, vulnerable persons) and map them to severity; drop the
   generic inflators (`completely`, `security`) and add a real Low path for
   hedged/question register.
5. **Decouple priority from severity with temporal urgency extraction** —
   parse deadlines and elapsed time ("fly in 18 hours", "due in three days",
   "eleven months now") so priority can exceed severity, matching the 6
   deadline-elevation cases in the dataset.
6. **Sentiment: contrast + sarcasm cues over word counts** — weight phrase
   polarity, detect mock-praise patterns (superlatives adjacent to failure
   statements, "thanks for" + negative event), treat questions/hedges as
   Neutral evidence, and stop counting bare "not"/"issue" as negative alone.
7. **Extract key facts into the executive summary** — pull amounts, durations,
   counts of failed attempts, and the customer's ask ("refund", "reassessment",
   "investigation") into the summary template so each summary is specific;
   target ≥90 unique summaries per 100 complaints.
8. **Let decision intelligence read the text** — actionability should factor
   severity-class and customer-ask presence, not just product presence, so a
   named-company fraud with a police report outranks a routine gadget defect;
   inject extracted facts (amount, deadline) into recommended actions.
9. **Rebalance similarity for non-product complaints** — raise company-match
   weight, add issue-fingerprint tokens (e.g. "double charge", "refund
   pending", "OTP"), widen `_COMPONENTS` beyond electronics (billing, claims,
   delivery, safety failure modes), and lower/tier the 0.45 threshold — then
   gate risk/health so they don't swing hard on a single complaint.
10. **Calibrate confidence with a real "unknown" band** — lower the base
    score, penalize General-fallback and Neutral-by-default outcomes, and
    surface a below-threshold "low confidence — needs human review" state
    instead of a 0.45–0.65 floor on wrong answers.

---

## Appendix: Reproduction

```bash
python data/evaluation/run_eval.py     # prints aggregates, writes results.json
```

Reference time fixed at 2026-07-17 12:00; corpus history items are dated one
day earlier (deterministic). Strict scoring = case-insensitive equality against
`expected`; lenient scoring additionally accepts alternates named in `notes`.
