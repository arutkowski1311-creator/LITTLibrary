# Reports

Point-in-time snapshots from the Clinical Intelligence Engine. The durable system of
record is [`../database.json`](../database.json) (read live by the root `index.html`
dashboard); each report below captures one run against it.

| Date | Mode | Window | Found | Added | Updated | Skipped | Report |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| 2026-06-29 | surveillance | 2026-04-29 → 2026-06-29 | 20 | 8 | 0 | 12 | [2026-06-29-surveillance.md](2026-06-29-surveillance.md) |
| 2026-06-29 | verification | provenance pass (29 partial items) | 29 | 0 | 29 | 0 | — |
| 2026-06-29 | baseline | 2015-01-01 → 2026-06-29 | 84 | 78 | 0 | 6 | [2026-06-29-baseline.md](2026-06-29-baseline.md) |
| 2026-06-27 | baseline-backfill | 2020-01-01 → 2026-06-27 | 17 | 17 | 0 | 0 | — |
| 2026-06-27 | surveillance | 2026-04-27 → 2026-06-27 | 12 | 10 | 2 | 0 | [2026-06-27-surveillance.md](2026-06-27-surveillance.md) |
| 2026-06-26 | baseline | 2024-06-26 → 2026-06-26 | 48 | 31 | 0 | 0 | [2026-06-26-baseline.md](2026-06-26-baseline.md) |

**Database total: 144 findings** spanning 2012–2026, mapped across all 12 indications and
scored on two axes (Clinical Impact ★1–5; LITT Business Impact 0–10 with tailwind/headwind
direction). Provenance: 135 verified · 8 partial · 1 unverified.

- **Baseline scan** establishes the field from `baselineStartDate` (currently **2015-01-01**)
  through the run date.
- **Surveillance scan** looks only at the trailing 2 months and adds deltas (dedup by
  DOI / URL / title+year).

Run with `/clinical-scan baseline` or `/clinical-scan surveillance`. See
[`../docs/clinical-intelligence-engine.md`](../docs/clinical-intelligence-engine.md) for the
governing spec and [`../.claude/commands/clinical-scan.md`](../.claude/commands/clinical-scan.md)
for the command.
