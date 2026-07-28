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
  and $/case vs region average.
- **Addressable reservoirs by indication.** Pool = claims coded for the indication in the
  account's referral area. Addressable = pool × a **per-indication LITT-eligibility factor**
  (radiation necrosis 20% · recurrent GBM 12% · focal epilepsy 8% · mets 3%) — not a flat
  rate, because LITT suitability differs sharply by indication. Both pool and factor are
  **editable per account** and recompute the bars, the $ opportunity (addressable × region
  avg case) and the headline live. This is the **total winnable market/yr, inclusive of
  current cases** — not incremental; the plan's realistic near-term add is the separate
  "Annual potential" figure. The logic is spelled out under each bar and in a panel note.
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

Health answers one question — **"are we winning here, and can we hold it?"** — as a
weighted 0–100 → letter grade. Each driver is computed from the account's actual
inputs and shown, with its derivation, on the card (no magic constants hidden):

| Driver | Max | Basis |
| --- | --- | --- |
| Momentum | 30 | revenue growth (2026 full-year vs prior), sanity-checked against the trend |
| Franchise & adoption | 25 | logged case volume + number of active surgeons (single-surgeon fragility) |
| Competitive position | 25 | do we own the LITT business — sole NeuroBlate vs competitor also in-house vs not ours |
| Value capture | 20 | revenue per case vs region average (graduated) |

**Opportunity/headroom is deliberately *not* in the health score** — reservoir size,
naïve targets and annual potential are upside, shown in their own sections, so a
competitive account we don't own yet reads as low health *and* high opportunity at
the same time. The grade and every qualitative field are seeds — all editable in the tool.
