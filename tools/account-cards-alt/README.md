# Account Report Cards — alternate build

A second, independently-built version of the Account Report Card, kept alongside the
primary build (repo root + `tools/account-cards/`) so the two can be compared before
settling on one. **This is the alternate — the root build is currently primary.**

Open `account-cards-standalone.html` (double-click, works offline) to evaluate it.

## What's distinctive here

- **Everything is editable, and edits flow downstream.** Click any highlighted value.
  Editing a raw number — sales, cases, reservoir sizes, surgeon volume — **recomputes the
  KPIs, the health grade, the gauge and the charts live** (compute runs client-side).
  Add/remove SWOT points and strategy plays yourself.
- **Data-driven development targets.** LITT-naïve surgeons are **ranked by a transparent
  candidacy score** (SEEG implants, epilepsy/tumor craniotomies, wheelhouse LITT-affinity,
  KOL status, plus a web-research override). The develop-surgeon play leads with the top
  candidate and states the **"why this candidate"** with the real numbers. Weak candidates
  are flagged weak — e.g. an MVD/cranial-nerve surgeon scores low even if he's on the list.
- **Deep-dive research appendix for every performer AND naïve target** — not just KOLs.
  Body of work / research focus pulled from bios, hospital sites and PubMed; several
  Columbia targets carry **live-researched** dossiers (bio, focus, candidacy verdict,
  verified papers). Papers are **sorted by how closely they tie to LITT** (LITT = directly
  laser/ablation, ADJ = ablation-amenable indication), then by date. Drill-down links to
  hospital profile, PubMed, Google Scholar and Medscout, plus an editable field-notes line.
- **Correct capital taxonomy.** Robot (ROSA, Mazor, ExcelsiusGPS…) and navigation
  (ClearPoint SmartFrame, Brainlab, StealthStation…) are **separate dropdowns from a
  library** — ClearPoint SmartFrame is navigation, never a robot.
- **Composite health grade** as a gauge seal on every page **plus transparent sub-scores**,
  so the grade is never a black box.
- **Full-year 2026 projection** (through Dec 31), net-sales bars, KPI tiles for probes/case
  and $/case vs region average, and an addressable-reservoir chart.
- **Persist / share / print**: edits save to `localStorage` per account, with JSON
  **Export / Import** and a two-page **Print / PDF** (research appendix follows).

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
