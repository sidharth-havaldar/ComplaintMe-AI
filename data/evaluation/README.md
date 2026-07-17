# Cortexa Evaluation Dataset (DATA-001)

The benchmark dataset for measuring and improving Cortexa's understanding
quality. **Data only** — nothing in the application reads this directory yet;
an evaluation harness can be built against it later.

## Files

- `complaints.json` — 100 realistic complaints with expected (ground-truth)
  outputs.

## Structure

```jsonc
{
  "meta":   { /* dataset version, counts, scales */ },
  "labels": { /* the closed label space: categories → departments, scales */ },
  "complaints": [
    {
      "id": "eval-001",
      "industry": "Electronics",       // one of 11 industries
      "difficulty": "easy",            // easy | medium | hard | ambiguous
      "complaint": "…raw consumer text…",
      "expected": {
        "company": "Samsung",          // canonical name, or null if not stated
        "product": "Samsung Galaxy S23", // specific product, or null
        "category": "Product Failure",
        "department": "Customer Support",
        "sentiment": "Negative",       // Negative | Neutral | Positive
        "severity": "Medium",          // Low | Medium | High
        "priority": "Medium"           // Low | Medium | High
      },
      "notes": "optional — why the item is hard/ambiguous, grading guidance"
    }
  ]
}
```

## Difficulty levels

- **easy** — company/product stated plainly, one clear issue, strong cues.
- **medium** — some fields implicit, indirect phrasing, or mixed signals.
- **hard** — sarcasm, multiple intertwined issues, misleading positive words,
  or emotionally-loaded narratives.
- **ambiguous** — genuinely unclear intent (questions, musings, mixed
  reviews). Expected values may be `null`; graders should accept the
  documented alternatives in `notes`.

## Grading guidance

- `company` / `product` match is case-insensitive on the canonical value;
  `null` means the text does not establish one.
- `category`/`department` come from the closed label space in `labels`.
  The space is a superset of the current heuristic taxonomy — items using
  the newer labels (e.g. `Fraud & Security`, `Safety Concern`) are expected
  to fail on the V1 heuristic and exist to measure future providers.
- For `ambiguous` items, `notes` lists acceptable alternates where relevant.
