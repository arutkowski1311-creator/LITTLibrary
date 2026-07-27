# LITT Account Report Cards

A printable, editable report card for each Northeast territory account. Two
letter pages (Snapshot + Strategy) plus a per-physician research appendix.

## Files
| File | What it is |
| --- | --- |
| `account-cards-standalone.html` | The tool with data embedded — double-click to open, works offline. |
| `account-cards.html` | Same (hosted copy). |
| `account-cards-artifact.html` | Body-only build for publishing as a claude.ai artifact. |
| `account_cards.json` | Processed dataset (system of record). |
| `build_data.py` | Joins account_intel + physician profiles + 3yr sales → `account_cards.json`. |
| `build_html.py` | Renders the HTML tool from `account_cards.json`. |

## Rebuild
```
python3 tools/account-cards/build_data.py   # rebuild data
python3 tools/account-cards/build_html.py   # rebuild HTML
```

## Sections
1. **Header** — account type, LITT status, system, platform, robot/MRI/nav, SEEG, >50 crani, contract, health grade.
2. **Business Health** — composite A–F grade + 5-driver radar, 3-year sales (consumable vs capital) with projection, KPIs (cases, probes/case, $/case vs region, potential), reservoir penetration by indication.
3. **Physician Universe** — performers, LITT KOLs, LITT-naïve targets, referrers by indication. Names with research link to the appendix.
4. **SWOT** — auto-seeded from platform, surgeon depth, reservoirs, competitive flags; editable.
5. **Strategy & Tactics** — develop-surgeon, crack-competitive, and activate-referral plays; editable.
6. **Research Appendix** — by physician: identity, themes, relevance grade, publications, KOL network.

Every seeded qualitative field is editable in the browser (Edit mode) and
persists to localStorage per account. Print / PDF via the toolbar.

## Data engine notes
- Sales metrics (net by year, probes, cases, probes/case, $/case) are derived from the 2024–2026 NE sales exports.
- Cases ≈ distinct invoices carrying a procedure fee (fallback: probe invoices).
- Health grade = weighted trajectory + reservoir headroom + surgeon depth + competitive position + commitment.
- Header facts not in any dataset (MRI/robot/nav/contract) are seeded from the territory deck where stated, else flagged "Confirm in field" and left editable.
