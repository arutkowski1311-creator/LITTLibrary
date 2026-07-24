# LITT Physician Profiles — Methodology

A physician-profiling layer for the Northeast territory: every clinician who performs LITT
on **our equipment (NeuroBlate)**, on a **competitor's** laser, or who does **tumor/epilepsy
craniotomy without LITT** — each with system affiliation, referral network, and a triangulated
view of realistic LITT volume.

## Deliverables

| File | What it is |
| --- | --- |
| `physician-profiles.html` | Interactive dashboard (hosted — fetches `physician-profiles.json`). |
| `physician-profiles-standalone.html` | Same dashboard with the data embedded — double-click, no server. |
| `physician-profiles.json` | The processed dataset (system of record for the dashboard). |
| `LITT_Physician_Profiles.xlsx` | 11-tab workbook: cohorts, referral network, editable model, accounts, competitive. |

## Sources

- **Total_Docs** — Medscout claims for ~3,500 Northeast clinicians. Master identity + procedure counts.
- **2026_Sales_Data_NE / Probes_Per_Procedure** — Monteris NeuroBlate sales; identifies our installed customers.
- **Patient_Counts_By_Site_By_Indication** — same procedure structure rolled up by site.
- **NeuroBlate Northeast Territory Plan** — field intelligence: confirmed users, referrers, reservoirs, platforms, business potential.
- **ASSFN epilepsy & AANS/CNS oncology position statements + NeuroBlate/LAANTERN literature** — the disease-rate anchors.

## Performing vs. referring

Every procedure appears **twice** in the source. Per the data owner's rule, the **higher** value is
the clinician's **performing** count (they did the procedure); the **lower** is their **referring**
count (patients they sent that were treated elsewhere). Surgeons show high performing; epileptologists,
neuro-oncologists and radiation oncologists show referring.

## Cohorts

| Cohort | Definition |
| --- | --- |
| ① **LITT — Our Equipment (NeuroBlate)** | Field-confirmed Monteris users from the territory plan. Claims LITT counts undercount academic volume, so field confirmation — not the claims number — governs membership. |
| ② **LITT — Competitor Equipment** | Field-confirmed users on Visualase (Medtronic) / ClearPoint, plus competitive-account and prospect LITT surgeons. |
| ③ **LITT — Unverified Platform** | A neurosurgeon whose claims show LITT, but the laser platform is not field-confirmed. Verify — could be ours or a competitor's. |
| ④ **LITT-Naïve Craniotomy Surgeon** | Neurosurgeons with tumor and/or epilepsy craniotomy volume but zero LITT — the category-development conversion pool. |
| **Referring Clinician** | Neurology, epilepsy, neuro-onc, rad-onc who manage/refer the disease pools that feed LITT. |

A non-neurosurgeon with a LITT count in claims is treated as a referrer (the LITT is claims attribution,
not a procedure they performed). Organization/facility rows are separated from individual clinicians.

## Potential-volume model

For each clinician (and each account reservoir):

```
epilepsy addressable = Intractable-epilepsy pool × addressable%
onc addressable      = Mets / radiation-necrosis pool × addressable%
untapped LITT / yr   = (epilepsy addressable + onc addressable) − LITT already performed   (floored at 0)
```

**Addressable % = 5%** (blended, LITT-appropriate + realistically convertible per year). This is the
uniform rate the territory plan applies across every account reservoir; it is editable in a single cell
on the Excel `Model — Editable` tab.

### Why 5% is defensible — the triangulation

- **Epilepsy.** 25–40% of epilepsy is drug-resistant (DRE); the "Intractable Epilepsy" claims count
  already isolates that pool. Only **~4%** of eligible DRE patients receive surgery today (ASSFN position
  statement) — the untreated majority is the runway. LITT delivers 44–78% seizure freedom at 1 year
  (58% in the 234-patient MTLE series).
- **Tumor.** Up to **49%** of tumors sit in or near eloquent areas, making resection difficult or
  impossible — LITT's core indication (AANS/CNS). The Mets/RN pool feeds recurrent-metastasis and
  radiation-necrosis LITT (NCCN 2024 includes poor surgical candidates).

**Worked example** (the data owner's own framing): a neurologist with 1,163 intractable-epilepsy
patients → 1,163 × 5% ≈ **58 addressable LITT candidates/yr**. If they have referred ~0, that is 58
untapped — the "there have to be candidates out there" math, quantified.

## Evidence library

A curated set of clinical papers grouped by disease pathway (epilepsy/MTLE, GBM/HGG, brain
metastases, radiation necrosis, meningioma, tumor-wide, safety) — the "evidence to carry." Each
physician profile auto-surfaces the papers matching its dominant pathway (epilepsy vs. oncology).
Sourced from the NeuroBlate/LAANTERN literature and the Monteris clinical briefs; five are recent
additions, flagged **NEW**:

- **LITT + adjuvant pembrolizumab in recurrent high-grade astrocytoma** — Campian *et al.*, *Nature
  Communications* 2026 (Phase 1/randomized Phase 2b; >3× improved OS; LITT–immunotherapy synergy).
- **LITT + SRT for recurrent brain metastases** — Grabowski *et al.*, *Neuro-Oncol Adv* 2022 (FFLP
  29.8 vs 7.5 vs 3.7 months).
- **LITT for new & recurrent meningioma** — Chiang *et al.*, *J Neurosurg* 2024 (new indication;
  61.4% 1-yr local control at ≥91% ablation).
- **LITT + early intervention post-SRS** — Sankey *et al.*, *Neurosurgery* 2022 (steroid cessation,
  RN vs recurrence biopsy).
- **MTLE durability** — Landazuri *et al.*, *JAMA Neurology* 2025 (2-yr Engel I ~58%).

## Growth-lever playbook

A "what to bring" layer that pairs with the "who to see." The four Monteris growth levers map onto
the tool's cohorts, and each carries its recommended marketing, clinical, market-access and program
tools:

| Growth lever | Targets cohort | Motion |
| --- | --- | --- |
| **Add New Users in Existing Accounts** | LITT-naïve craniotomy surgeons; unverified LITT | Convert a second/naïve surgeon at an account we already sell |
| **Add New Disease States in Existing Accounts** | NeuroBlate users (ours) | Grow a current user into a new indication (heat-map whitespace) |
| **Expand Referral Networks in Existing Accounts** | Referring clinicians | Develop the referrers who feed our surgeons |
| **New Accounts** | Competitor / prospect users | Win a prospect, competitive, or greenfield account |

Each physician profile auto-recommends the play for that clinician's cohort. The full matrix is on the
dashboard **Playbook** view and the `Playbook` tab of the Excel workbook.

## Indication wheelhouse (triangulated)

Each profile header leads with the physician's **indication wheelhouse** — the LITT indications that are
genuinely "in their wheelhouse," triangulated from **both** their claims/patient data and their research:

- **Claims signals:** intractable-epilepsy pool, SEEG volume, epilepsy craniotomies, mets/RN pool, SRS
  (necrosis feeder), tumor craniotomies, LITT already performed.
- **Research signals:** SEEG, LITT, epilepsy-surgery, glioma, brain-mets, radiation-necrosis flags plus
  theme/paper keyword matching (mesial temporal, hypothalamic hamartoma, heterotopia, cortical dysplasia,
  insular, callosotomy, glioblastoma, radiation necrosis, IDH-mutant, …).

Indications scored: **MTLE, hypothalamic hamartoma, PVNH/heterotopia, focal cortical dysplasia, insular,
corpus callosotomy, cavernous** (epilepsy); **recurrent GBM, glioma/HGG, lower-grade glioma, brain
metastases, radiation necrosis** (oncology). Each carries a strength (Strong / Moderate / Emerging), the
drivers (research / practice / pool), and a plain-English "why". A one-line **archetype** summarizes the
orientation (e.g. *"SEEG-driven epilepsy ablation — MTLE, PVNH, focal cortical dysplasia"* or
*"Neuro-oncology ablation — brain metastases, radiation necrosis, glioma/HGG"*).

Key rule per the field ask: **heavy SEEG / intracranial-EEG activity (in claims or research) drives the
deep-focus epilepsy ablation indications — MTLE, HH, PVNH, FCD, insular** — because SEEG localizes exactly
the foci LITT ablates. Shown in the profile header, on Research Focus cards, and in the Excel `Physician
Master` tab.

## Research focus (citation-network grading)

For the LITT *performer* targets (surgeons who could adopt or grow LITT), a research deep-dive is
compiled from public web sources (Google Scholar, institutional pages, journal/PubMed listings,
ResearchGate) via automated web-research agents and baked into the profile. Each carries:

- a **LITT-relevance grade (A–D)** — an editorial rubric: **A** = direct LITT/laser-ablation research
  *or* SEEG-guided epilepsy ablation *or* ablation of glioma/mets/radiation-necrosis; **B** =
  convertible epilepsy / stereotactic-functional / neuro-onc surgery with no direct LITT yet; **C** =
  limited; **D** = little/none. (A neurosurgeon publishing on **SEEG** grades highly, because SEEG
  localizes the epileptogenic zone that LITT then ablates.)
- **LITT-adjacency signals** (SEEG, LITT, epilepsy surgery, glioma, brain mets, radiation necrosis,
  stereotactic/functional, MR thermometry, immuno/BBB, DBS/neuromod),
- **research themes** and **key papers**,
- a **collaboration/citation network** — frequent co-authors, with **LITT-KOL** connections flagged
  (co-authors in your territory are clickable to open their profile), and
- source links (Scholar, institutional profile, journal pages).

Grade contributes a bonus to the opportunity score (A +14, B +7). Surfaced in a dedicated **Research
Focus** view, a grade badge in the Explorer (with a "Research-graded only" filter), the profile
deep-dive, and a `Research Focus` tab in the Excel workbook. Research profiles live in
`tools/physician-profiles/research_raw.jsonl` and are re-attached on every build; the initial set
covers the top targets and is designed to extend to the full 152-surgeon target list.

## Opportunity score

A COI-style composite used to rank the Explorer:
`untapped ×1 + LITT performed ×3 + epilepsy craniotomy ×0.6 + tumor craniotomy ×0.6`, plus a bonus for
field-confirmed / plan-named clinicians.

## LITT Library integration

The tool taps into the repo's living clinical-intelligence database (`database.json`, 144 findings,
2012–2026 — the same source that powers `index.html`). At build time each finding is tagged to a
pathway (epilepsy vs. oncology) from its indications and embedded into `physician-profiles.json`. It
surfaces in two places:

- a browsable **LITT Library** view (filter by pathway/direction, sort by recency or clinical impact),
  with each finding scored on clinical impact (★1–5) and LITT business direction (▲ tailwind / ▼
  headwind), and
- a **"From the LITT Library"** section on each physician profile — the top-impact findings for that
  clinician's pathway.

A sidebar link opens the full LITT Library dashboard (`index.html`). Rebuilding the physician dataset
(`build_data.py`) automatically re-reads `database.json`, so refreshing the clinical library refreshes
the physician tool too.

## Caveats

- Claims data (Medscout) **undercounts** academic-center volume and **cannot identify the laser platform**.
  Field intelligence overrides data where the two disagree.
- The model is **directional targeting signal — not a revenue forecast and not for clinical
  decision-making**.
- Clinical outcome figures come from real-world registry/cohort evidence (LAANTERN), not randomized
  head-to-head trials against open surgery.

## Regenerating

```
python3 build_data.py     # -> physician-profiles.json  (+ console summary)
python3 build_excel.py    # -> LITT_Physician_Profiles.xlsx
# standalone = physician-profiles.html with the JSON injected as window.__EMBED__
```
The build scripts live alongside this repo's data pipeline (see the branch history for
`build_data.py`, `build_excel.py`, and `account_intel.py`).
