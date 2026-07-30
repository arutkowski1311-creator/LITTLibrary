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
updates every view. `database.json` is the system of record: **144 findings** spanning
2012-2026, each dated, mapped to indications, and scored on two axes.

### Physicians roster
A **Physicians** tab lists curated physicians/investigators active in LITT and related
neurosurgery. It is backed by its own system of record, `physicians.json` — a *deliberate*
KOL roster (not derived from paper authorship), so recognized figures appear whether or not
they authored a tracked finding. Each physician is mapped to `database.json` indication keys,
which powers the "related findings" cross-links and indication chips on every profile card.
Affiliations are web-verified as of `physicians.json > lastUpdated`; a `confidence` flag marks
entries whose current primary institution could not be confirmed (shown as an
"affiliation unverified" badge). The hosted pages fetch `physicians.json`; the offline
`*-standalone.html` builds embed the same roster as `window.__PHYS__`, so refreshing a
standalone build means re-embedding the current `physicians.json`.

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
