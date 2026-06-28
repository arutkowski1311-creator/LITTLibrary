# LITT Library — Clinical Intelligence Hub

Living library of LITT-related clinical, scientific, regulatory, reimbursement, and
competitive intelligence for neuro-oncology, epilepsy, and MRI-guided laser ablation.

## View
- **Hosted (recommended):** Settings -> Pages -> Deploy from a branch -> `main` / `/(root)`.
  Then open `https://arutkowski1311-creator.github.io/LITTLibrary/`.
- **Offline:** download `lit-library-standalone.html` and double-click (data embedded).

`index.html` (root) is the live dashboard and reads `database.json` directly, so updating the
data updates the dashboard. `database.json` is the system of record: 58 findings spanning
2020-2026, each mapped to indications and scored on two axes (clinical impact + LITT business
impact with tailwind/headwind direction).

## Update
`docs/clinical-intelligence-engine.md` is the spec; `.claude/commands/clinical-scan.md` is the
`/clinical-scan` command (baseline since 2020 + recurring trailing-2-month surveillance that
only adds new content, dedup by DOI/URL/title). Reports land in `reports/`.
