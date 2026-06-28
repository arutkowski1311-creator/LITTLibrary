---
description: Run the Clinical Intelligence Engine scan (neuro-oncology / epilepsy / LITT) and write a dated report
argument-hint: "[baseline|surveillance]  (default: surveillance)"
allowed-tools: Read, Write, Edit, Bash, WebSearch, WebFetch, Agent, Glob, Grep
---

You are running the **Clinical Intelligence Engine** defined in
`docs/clinical-intelligence-engine.md`. Execute a full scan and produce a dated report.

## Step 0 — Setup

1. Read `docs/clinical-intelligence-engine.md` in full. It is the governing specification;
   follow its Mission, Guiding Principle, Scope, prioritization rules, Evaluation Framework,
   per-publication output structure, and Executive Report structure exactly.
2. Read `reports/STATE.json` to get the last run date and report history.
3. Determine **today's date** (use the current date provided in your context, or run
   `date +%F`).
4. Determine the **mode** from the argument `$1`:
   - `baseline` → window = from the configured `baselineStartDate` in `STATE.json`
     (currently **2020-01-01**) through today.
   - `surveillance` (default if no argument, or if STATE shows a prior baseline already ran)
     → window = **trailing 2 months** ending today.
   - If `$1` is empty and `STATE.json` shows no baseline has ever run, default to
     `baseline`. Otherwise default to `surveillance`.
   State the resolved mode and the exact date window (YYYY-MM-DD to YYYY-MM-DD) before
   proceeding.

## Step 1 — Research (fan out)

Spawn parallel `general-purpose` subagents (web-enabled), one per domain below, each scoped
to the resolved date window. Instruct every subagent to:

- Use real web/literature searches only. **Never fabricate citations, dates, or results.**
  If a fact can't be verified, omit it or flag it as unverified.
- Return only items that clear the Guiding Principle ("will this make a clinician better
  informed tomorrow?"), respecting the spec's prioritize / lower-priority / ignore tiers.
- For each item return structured data: citation, source URL, publication/announcement date,
  journal or venue, study design, population, sample size, endpoints, results, statistical
  significance, limitations, and a one-line clinical bottom line.

Domains:

1. **Neuro-oncology clinical evidence** — GBM, low/high-grade glioma, brain metastases,
   radiation necrosis, meningioma; randomized/multicenter trials, meta-analyses, guidelines.
2. **LITT-specific evidence** — NeuroBlate / laser interstitial thermal therapy / MRI
   thermometry across tumor and epilepsy indications; outcomes, comparative effectiveness,
   long-term follow-up.
3. **Epilepsy surgery** — drug-resistant epilepsy, MTLE, SLAH, hypothalamic hamartoma,
   SEEG, neuromodulation, surgical algorithms; trials and guidelines.
4. **Regulatory & device landscape** — FDA approvals/clearances/label changes, coverage
   decisions; competing ablation, navigation, robotics, planning, and biopsy platforms.
5. **Adjacent & competitive therapies + imaging** — radiosurgery, proton therapy, TTFields,
   immunotherapy, targeted/cellular/viral therapy, AI-assisted planning, intraoperative MRI,
   functional imaging — as they affect LITT positioning, sequencing, and referral.
6. **Ecosystem, policy & lay-press signals** — reputable general/business/trade outlets
   (NYT, WSJ, Washington Post, Reuters, AP, Bloomberg, CNN, BBC, NPR, The Economist, STAT,
   Endpoints, Fierce Biotech/Healthcare, MedTech Dive, Becker's) plus CMS/payer coverage and
   funding/M&A/policy news that shape the *whole* world of brain tumors and epilepsy and could
   influence LITT adoption, referral, reimbursement, or perception. Per the spec's lay-source
   guardrails: surface the signal, then trace to and cite the **primary source**; never let a
   headline launder an unverified clinical figure.

Cast a wide net — search **scholarly indexes** (PubMed/MEDLINE, Europe PMC, Google Scholar,
Semantic Scholar, medRxiv/bioRxiv), **all relevant journals** (not only the prioritized list),
**prioritized conferences** (SNO, AANS, CNS, AES, ASCO, ASTRO, ESMO, AACR, RSNA, ISMRM, SMR),
and **ClinicalTrials.gov / WHO ICTRP** for pivotal trial status changes. Leave no respected
journal, registry, or outlet unchecked.

**Cover every indication.** Map across all 12 indications in `taxonomy.indications`, not just
the well-populated ones. The current corpus is thin on `corpus_callosotomy`, `meningioma`,
`newly_lgg`, and `recurrent_lgg` — actively seek developments for these and for any adjacent
topic that could bear on LITT use, so the baseline is genuinely comprehensive.

**Every finding must be dated.** Capture an ISO `date` (`YYYY-MM-DD`) or at minimum the
publication **year**; an item with no establishable date is not admissible (see spec).

## Step 2 — Appraise, map & score (two axes)

For every retained item, apply the full Evaluation Framework from the spec:

- **Map** the item to all relevant `indications` (from the 12-key product taxonomy in
  `database.json` → `taxonomy.indications`) and `strategies`
  (`taxonomy.strategies`). Map *every* indication it meaningfully bears on.
- **Axis 1 — Clinical Impact Score** (`clinicalImpactScore`, integer 1–5): impact to the
  clinical discipline.
- **Axis 2 — LITT Business Impact** (`littBusinessImpact`, integer 0–10) **plus**
  `littBusinessDirection` (`tailwind` = strengthens LITT, `headwind` = weakens/displaces,
  `neutral`). These are independent of Axis 1 — a study can be clinically huge but a headwind,
  or clinically minor but a decisive business event (e.g., a competitor clearance).
- **Business levers** (`businessLevers`): any of utilization / referral / reimbursement /
  competitive / pipeline / messaging. **Time horizon** (`timeHorizon`): now / `<=12mo` /
  `2-5yr`.
- Evidence Strength, Specialty Relevance (High/Mod/Low per specialty), Competitive Impact
  note, `whoShouldKnow`, and a `verified` flag (verified / partial / unverified).

## Step 3 — Merge into the cumulative database (skip what we already have)

The database `reports/database.json` is the **system of record**; it only ever grows. Reruns
must **not** duplicate existing content — they add new items and update existing ones only
when something materially changed.

1. Load `reports/database.json` (shape: `{ ..., runs:[], items:[] }`).
2. For each new finding, compute a stable **dedup key** in this priority order:
   - DOI (normalized, lowercased) if present;
   - else the source URL with tracking params stripped;
   - else a slug of `lower(title)` + publication year.
   Set the item's `id` to a readable slug derived from the title; keep the dedup key for
   matching.
3. Compare against existing items by dedup key:
   - **Already present, nothing changed** → **skip** (do not re-add, do not duplicate).
   - **Already present but materially changed** (longer follow-up, status change, label
     expansion, retraction, guideline adoption) → **update in place**, set
     `status:"updated"`, set `lastUpdatedRun` to today, and write a one-line `changeNote`
     describing what changed.
   - **Not present** → append with `status:"new"`, `firstSeenRun` and `lastUpdatedRun` =
     today.
4. Each item object carries the spec's fields plus: `id`, `dedupKey`, `domain`,
   `clinicalImpactScore` (int 1–5), `evidenceStrength`, `specialtyRelevance` (object keyed
   by `neurosurgery,neuroOncology,epileptology,radiationOncology,neuroradiology,
   medicalOncology` → High/Moderate/Low), `monterisImpact` (0–10), `competitiveImpact`,
   `whoShouldKnow` (array), `whyMatters`, `firstSeenRun`, `lastUpdatedRun`, `status`,
   `changeNote`.
5. Append a run record to `runs`: `{date, mode, window, found, added, updated, skipped}` and
   set top-level `lastUpdated` to today. Write the file back (pretty-printed).
6. At the start of the next run, **everything in `items` is "what we already have"** — that
   is how reruns skip prior content. `status:"new"`/`"updated"` flags should reflect *this*
   run only, so reset stale `new`/`updated` flags from earlier runs to `"carried"` before
   merging.

## Step 4 — Write the human-readable report

Write to `reports/<YYYY-MM-DD>-<mode>.md` (a point-in-time snapshot of *this run*):

1. Header: report date, mode, exact date window, counts (found / added / updated / skipped),
   one-paragraph orientation.
2. The full **Executive Report** (all 28 sections from the spec), built from the database.
3. **Per-publication entries** for items added/updated this run, grouped by domain, using the
   spec's structured output fields and scores.
4. A closing **References** list with source URLs.

Use the spec's tone rules: balanced, evidence-based, non-promotional; distinguish
established vs. promising vs. speculative; explain conflicts. Carry through any UNVERIFIED
flags from research rather than laundering them into confident claims.

## Step 5 — Update index, dashboard, state & report back

1. The team dashboard `reports/dashboard.html` reads `database.json` directly — no edit
   needed unless the schema changed.
2. Update `reports/README.md`'s index table with the new report and the new database totals.
3. `reports/STATE.json`: set `lastRunDate`, `lastMode`, append to `history`
   (`{date, mode, window, found, added, updated, skipped, reportPath}`); if baseline, set
   `baselineDate`.
4. Commit on the current branch with a clear message and push (`git push -u origin <branch>`).
   Do **not** open a pull request unless asked.
5. Reply with: mode, window, counts (found/added/updated/skipped), the top 5 highest-impact
   developments this run, and the report path.
