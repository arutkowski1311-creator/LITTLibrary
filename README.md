# LITT Library — Clinical Intelligence Hub

Living library of LITT-related clinical, scientific, regulatory, reimbursement, and
competitive intelligence for neuro-oncology, epilepsy, and MRI-guided laser ablation.

## View

Two front-ends read the same `database.json`:

| Audience | Hosted | Offline (single file) |
| --- | --- | --- |
| **Full / strategy** (clinical + LITT business impact) | `index.html` → `…github.io/LITTLibrary/` | `lit-library-standalone.html` |
| **Physician-facing** (clinical only, business impact removed) | `physician.html` → `…github.io/LITTLibrary/physician.html` | `physician-standalone.html` |

- **Hosted:** Settings → Pages → Deploy from a branch → `main` / `/(root)`, then open the URLs above.
- **Offline:** download the relevant `*-standalone.html` and double-click (data embedded, no internet).
- A **Physician View / Full View** toggle is in each dashboard's Quick Links.

`index.html` is the live dashboard and reads `database.json` directly, so updating the data
updates every view. `database.json` is the system of record: **176 findings** spanning
2012-2026, each dated, mapped to indications, and scored on two axes.

### The two scoring axes
- **Clinical Impact (★1–5):** an editorial rating against a fixed rubric in the engine spec
  (5 = immediate practice-changing → 1 = minimal importance), judged from study design,
  evidence level, endpoints, effect size, and how directly it changes patient care. It is a
  criteria-anchored judgment, **not** an arithmetic formula.
- **LITT Business Impact (0–10 + tailwind/headwind direction):** how strongly a development
  moves the LITT business, independent of clinical impact. **Shown only in the full view; the
  physician view hides this axis entirely** (along with competitive intelligence,
  who-should-know routing, reimbursement, and strategy tags).

## Update
`docs/clinical-intelligence-engine.md` is the spec; `.claude/commands/clinical-scan.md` is the
`/clinical-scan` command (baseline since 2020 + recurring trailing-2-month surveillance that
only adds new content, dedup by DOI/URL/title). Reports land in `reports/`.
`python3 scripts/merge_findings.py` merges research output into `database.json` (dedup +
run log); `python3 scripts/build_standalone.py` rebuilds both offline files afterwards.

## Content
`docs/content-creation-engine.md` is the spec and `.claude/commands/content-engine.md` the
`/content-engine` command: it turns verified library findings into review-ready posts for a
personal LinkedIn profile, the **Epilepsy Collab**, and the **Brain Tumor Collab** (physician-safe
fields only; vendor-neutral; every post ends in an open question). Drafts, the posting ledger,
the event calendar, and the Collab growth playbook live in `content/`.
