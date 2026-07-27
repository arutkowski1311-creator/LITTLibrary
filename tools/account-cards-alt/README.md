# Account Report Cards — alternate build

A second, independently-built version of the Account Report Card, kept alongside the
primary build (repo root + `tools/account-cards/`) so the two can be compared before
settling on one. **This is the alternate — the root build is currently primary.**

Open `account-cards-standalone.html` (double-click, works offline) to evaluate it.

## What's distinctive here

- **Composite health grade** shown as a gauge seal on every page **plus transparent
  sub-scores** (trajectory / reservoir capture / surgeon depth / competitive position /
  value capture), so the grade is never a black box.
- **Research appendix** with paper titles linked to **PubMed**, organized
  physician → indication/area → facility; KOL names in the universe tables jump to it.
- **Net-sales bars with a dashed projection bar**; KPI tiles for probes/case and
  $/case vs the region average.
- **Edit + persist**: header confirmations, situation, SWOT and strategy tactics are
  editable inline, saved to `localStorage` per account, with JSON **Export / Import**
  and two-page **Print / PDF**.

## Files

| File | What it is |
| --- | --- |
| `account-cards-standalone.html` | Tool with data embedded — double-click, offline. |
| `account-cards.html` | Same tool, hosted (fetches `account-cards.json` from this folder). |
| `account-cards-artifact.html` | Body-only fragment for a claude.ai artifact publish (git-ignored, generated). |
| `account-cards.json` | Processed dataset (system of record for this build). |

## Rebuild

Builders live in `tools/physician-profiles/` (they share that folder's staged sales
exports) and write their output here:

```
python3 tools/physician-profiles/build_account_cards.py   # → account-cards.json
python3 tools/physician-profiles/build_account_html.py     # → the three HTML variants
```

## Sources joined

- `tools/physician-profiles/account_intel.py` — curated territory-plan intelligence.
- `physician-profiles.json` — the 2,807-provider universe (cohorts, SEEG/craniotomy
  volumes, `litt_relevance` grade + `key_papers`/`recent_papers`, wheelhouse).
- `tools/physician-profiles/sales_2024|2025|2026.xlsx` — raw NeuroBlate invoices →
  net sales, probes, cases, probes/case, $/case, projection, SKU mix.

## Composite health score

Weighted 0–100 → letter grade (sub-scores shown on the card):

| Sub-score | Max | Basis |
| --- | --- | --- |
| Trajectory | 25 | trend (Up/Down/Flat/New/Competitive) |
| Reservoir capture | 20 | cases logged vs total addressable reservoir |
| Surgeon depth | 20 | active performing surgeons (single-surgeon risk) |
| Competitive position | 20 | competitive laser in-house / competitive-class penalty |
| Value capture | 15 | revenue per case vs region average |

The grade and every qualitative field are seeds — all editable in the tool.
