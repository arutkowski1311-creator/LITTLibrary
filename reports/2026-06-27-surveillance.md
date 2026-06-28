# Clinical Intelligence Report — Surveillance Scan

**Date:** 2026-06-27 · **Mode:** Surveillance (delta) · **Window:** 2026-04-27 → 2026-06-27 (trailing 2 months)
**Counts:** 12 verifiable in-window candidates · **10 added** · **2 updated** · 0 skipped-as-duplicate-of-prior-report
**Database now:** 41 findings · [`database.json`](database.json) · [`dashboard.html`](dashboard.html)
**Prior report:** [2026-06-26-baseline.md](2026-06-26-baseline.md)
**Engine:** Clinical Intelligence Engine v1.0 — see [`../docs/clinical-intelligence-engine.md`](../docs/clinical-intelligence-engine.md)

> Orientation: This is the first surveillance run, one day after the 24-month baseline, so the
> 2-month window sits *inside* the baseline window. Five web-enabled domain agents ran in
> parallel (neuro-oncology, LITT-specific, epilepsy surgery, regulatory/device, adjacent/imaging).
> The **LITT-specific and epilepsy-surgery domains returned no verifiable in-window items** — a
> valid, expected result for a narrow niche over a 2-month window; the closest near-misses (a
> LITT/BBB-permeability mechanistic paper dated 2026-04-13 and the RNS post-approval study dated
> 2026-04-24) both fell *just before* the window and were correctly rejected. Every genuinely new
> finding is in neuro-oncology, adjacent/competitive therapy, or the device/regulatory landscape,
> clustered around **ASCO 2026** (May 29–Jun 2), a **June 18 Novocure** readout, an **NCCN
> v2.2026** guideline update, and discrete device milestones. Concurrent intra-day passes had
> produced duplicate event records and an inconsistent run log; this report reconciles the corpus
> to a single deduplicated state. Egress blocks on publisher/press pages (403 at the proxy) mean
> several figures are corroborated across multiple independent secondary sources rather than
> masthead-confirmed; those are flagged `partial`.

---

## What changed since the baseline

**2 updates to existing items:**

- **Vorasidenib / INDIGO** (`updated`) — ASCO 2026 extended follow-up (2026-05-31, Cloughesy et
  al.): with 21.3 months of additional data, median PFS by BIRC deepened to **44.1 months**
  (95% CI 27.7–NE); 144 of 163 placebo patients crossed over. Reinforces (does not change) the
  drug-first pathway in grade 2 IDH-mutant glioma — a continued mild **headwind** for LITT in
  that subgroup. *(partial — secondary-source figures.)*
- **Medtronic Stealth AXiS** (`updated`) — **CE Mark (EU), 2026-04-28**: spine + cranial market
  authorization in Europe, a geographic expansion of the navigation+robotics platform (distinct
  from the 2026-03-27 US cranial/ENT clearance already in the database). Deepens Medtronic's
  cranial-ecosystem footprint around Visualase LITT. *(verified via Medtronic newsroom URL slug +
  MassDevice / Ortho Spine News.)*

**10 new items added:**

| # | Development | Date | Domain | Clinical | LITT business |
| --- | --- | --- | --- | --- | --- |
| 1 | **ROADS phase 3** — Cs-131 tiles (GammaTile) vs post-op SRT, resected brain mets | 2026-05-30 | adjacent | ★4 | **5 ▼ headwind** |
| 2 | **NEO-TACTICS phase 2** — neoadjuvant fractionated SRT then resection, brain mets | 2026-05-30 | adjacent | ★3 | 4 ▼ headwind |
| 3 | **TTFields TRIDENT (EF-32)** phase 3 — earlier TTFields in GBM **misses** OS | 2026-06-18 | adjacent | ★3 | 4 ▲ tailwind |
| 4 | **NeoVax** phase 1 — personalized neoantigen vaccine + pembrolizumab, newly dx GBM | 2026-05-30 | neuro-onc | ★3 | 2 ■ neutral |
| 5 | **JCOG1703 (MACS)** phase 3 — carmustine wafers add no survival benefit (negative) | 2026-05-31 | neuro-onc | ★3 | 3 ▲ tailwind |
| 6 | **NCCN CNS v2.2026** — CSF liquid biopsy for biopsy-infeasible HGG/GBM | 2026-06-17 | adjacent | ★3 | 5 ▼ headwind |
| 7 | **Lucicebtide (ST101)** phase 2 — C/EBPβ antagonist + chemoRT, newly dx GBM (n=9) | 2026-05-21 | neuro-onc | ★2 | 1 ■ neutral |
| 8 | **Zeta Surgical** FDA 510(k) — frameless AI navigation + biopsy instruments | 2026-05-01 | regulatory | ★1 | 4 ■ neutral |
| 9 | **ClearPoint Neuro** — 10-yr focused-ultrasound / BBB-delivery partnership (SKKU) | 2026-05-27 | regulatory | ★1 | 3 ▼ headwind |
| 10 | **ClearPoint Neuro** Q1 2026 earnings (rev +43% YoY) | 2026-05-13 | regulatory | ★1 | 3 ■ neutral |

---

## Executive Summary

A quiet but not empty window, dominated by **ASCO 2026** brain-tumor data and a single
competitor-device readout.

The most strategically weighted item is **ROADS** (ASCO 2026, LBA2000): a randomized phase 3
showing intraoperative **Cs-131 tile brachytherapy (GammaTile)** cut 12-month surgical-bed
recurrence from ~12% to ~1% and improved 2-year OS (61.7% vs 35.7%) vs post-op SRT in **operable**
brain metastases, *without* excess radiation necrosis. It strengthens a "treat-locally-at-
resection" competitor and could blunt part of the post-SRS salvage funnel that feeds LITT —
though LITT's defensible niche (deep/inoperable lesions, biopsy-proven radiation necrosis,
SRS-refractory recurrence) is **not** what ROADS addressed. The companion **NEO-TACTICS** phase 2
points the same direction: neoadjuvant SRT before resection gave excellent local control with no
leptomeningeal spread and low necrosis — another vote for upfront resection-based pathways in
resectable mets.

Offsetting these, **TRIDENT** (TTFields started at chemoradiation vs maintenance in newly
diagnosed GBM) **missed** its OS primary endpoint (17.7 vs 17.5 mo; HR 0.953; p=0.519) — a
competitor's attempt to expand its footprint failed, leaving the GBM intensification narrative
flat and offering LITT mild relief. **JCOG1703 (MACS)** delivered another negative for a
competing local therapy: carmustine (Gliadel) wafers added no survival benefit in maximally
resected GBM, reinforcing that intracavitary chemo is not the answer and indirectly supporting
mechanism-driven local approaches.

On the molecular/diagnostic axis, **NCCN CNS v2.2026** now recommends **CSF-based genomic
profiling for biopsy-infeasible HGG/GBM**. This is a double-edged signal: it legitimizes
molecular workup when tissue is unobtainable (a population overlapping LITT's deep/eloquent
candidates), but by providing a *non-tissue* diagnostic route it slightly erodes the
"diagnose-and-ablate" (same-session biopsy + LITT) rationale in exactly those hard-to-reach
lesions.

The brightest investigational tumor signal is **NeoVax** (personalized neoantigen vaccine +
pembrolizumab) with encouraging propensity-matched survival in newly diagnosed GBM — mechanism-
adjacent to LITT's own immunotherapy-priming thesis but not LITT-specific. **Lucicebtide** is an
early, tiny single-arm signal worth only watchful awareness.

Device-side, the competitive ecosystem keeps tightening around LITT incumbents: **Medtronic**
took Stealth AXiS to **Europe (CE Mark)**; **ClearPoint** posted strong Q1 growth and formally
**entered focused ultrasound / BBB drug delivery** via a 10-year academic partnership (a long-
horizon platform-encroachment signal); and **Zeta Surgical** cleared a frameless AI navigation +
biopsy system — incremental competition in the biopsy/navigation lane adjacent to LITT planning.

---

## Top 10 Most Important Developments (this run)

1. **ROADS phase 3** — Cs-131 tiles beat post-op SRT for resected brain mets (ASCO 2026). ★4, business **5 ▼**.
2. **TRIDENT phase 3** — earlier TTFields misses OS in newly dx GBM (Novocure, Jun 18). ★3, business **4 ▲**.
3. **NCCN CNS v2.2026** — CSF liquid biopsy for biopsy-infeasible HGG/GBM. ★3, business **5 ▼**.
4. **NEO-TACTICS phase 2** — neoadjuvant SRT then resection, brain mets (ASCO 2026). ★3, business **4 ▼**.
5. **JCOG1703 (MACS) phase 3** — carmustine wafers negative in resected GBM (ASCO 2026). ★3, business **3 ▲**.
6. **NeoVax phase 1** — neoantigen vaccine + pembro, encouraging survival in GBM (ASCO 2026). ★3, business **2 ■**.
7. **Vorasidenib / INDIGO extended follow-up** — mPFS 44.1 mo (ASCO 2026). ★5 (item), business **6 ▼** *(update)*.
8. **Medtronic Stealth AXiS CE Mark (EU)** — navigation+robotics to Europe. ★1, business **7 ▼** *(update)*.
9. **ClearPoint Neuro focused-ultrasound entry** — 10-yr SKKU partnership. ★1, business **3 ▼**.
10. **Zeta Surgical 510(k)** — frameless AI navigation + biopsy instruments. ★1, business **4 ■**.

## Top 10 Papers (this run)
The ASCO 2026 set leads: ROADS (LBA2000), NEO-TACTICS (abstr 2003), JCOG1703/MACS (abstr 2001),
NeoVax (abstr 2006), INDIGO extended follow-up; plus the TRIDENT topline (peer review pending,
full data slated for ASTRO 2026), the NCCN v2.2026 guideline change, and the lucicebtide phase 2
window-of-opportunity update. No peer-reviewed LITT-specific or epilepsy paper verifiably
published in-window.

## Top 5 LITT Studies (this run)
**None verifiably in-window.** The LITT-specific domain returned no new in-window peer-reviewed
article. (Near-miss documented and rejected: a LITT/BBB-permeability mechanistic paper, advance
access 2026-04-13 — pre-window.) The existing flagship LITT evidence (LITT + pembrolizumab, Nat
Commun, Feb 2026) is unchanged this run.

## Top 5 Brain Tumor Studies (this run)
1. ROADS (Cs-131 tiles vs SRT, brain mets). 2. INDIGO extended follow-up (vorasidenib, grade 2
glioma). 3. JCOG1703/MACS (carmustine wafers negative, GBM). 4. NeoVax (neoantigen vaccine +
pembro, GBM). 5. NEO-TACTICS (neoadjuvant SRT then resection, brain mets).

## Top 5 Epilepsy Studies (this run)
**None verifiably in-window.** (Near-misses rejected as pre-window: RNS post-approval 3-yr
efficacy, online 2026-04-24; HH stereotactic RF ablation, Oct 2025; corpus callosotomy series,
Nov 2025.)

## Most Important Guideline Changes (delta)
- **NCCN CNS Cancers v2.2026** — adds CSF-based (tumor-derived DNA) genomic profiling as a
  recommended option for **biopsy-infeasible** high-grade glioma / GBM (and for suspected diffuse
  midline glioma, H3 K27-altered, for diagnosis and response). Corroborated by CancerNetwork,
  Targeted Oncology, GenomeWeb. *Implication:* a non-tissue diagnostic route in the same deep/
  inoperable population that LITT's diagnose-and-ablate play targets.

## Most Important FDA Activity (delta)
- **Zeta Surgical** FDA 510(k) (K253663), 2026-05-01 — Zeta Navigation System + navigated
  instruments (Zeta Stylet, Zeta Bolt) for brain biopsy, hydrocephalus, trigeminal neuralgia.
- **Medtronic Stealth AXiS — CE Mark (EU)**, 2026-04-28 (not FDA, but a regulatory milestone):
  spine + cranial authorization in Europe.
- No in-window FDA/CMS action specific to the core LITT platforms (NeuroBlate, Visualase,
  ClearPoint SmartFrame/Prism). No new national LITT coverage decision verified.

## Most Important Competitive News (delta)
- **ClearPoint Neuro** formally entered **focused ultrasound / BBB drug delivery** (10-yr SKKU
  partnership, preclinical large-molecule delivery) and posted **Q1 2026 revenue +43% YoY**.
- **Medtronic** extended its navigation+robotics cranial stack to **Europe** (CE Mark).
- **Zeta Surgical** added a frameless AI navigation + biopsy entrant in the lane adjacent to LITT
  planning/biopsy.

## Most Important Clinical Trial Updates (delta)
- **ROADS** read out positive (phase 3, brain mets). **TRIDENT** read out negative (phase 3, GBM
  TTFields timing). **JCOG1703/MACS** read out negative (phase 3, carmustine wafers). **INDIGO**
  extended follow-up matured (mPFS 44.1 mo). **NEO-TACTICS** (phase 2) and **NeoVax** (phase 1)
  reported encouraging early data.

## Most Important Imaging Advances (delta)
- No dedicated in-window imaging/AI publication cleared the bar. The closest signal is the
  **NCCN CSF liquid-biopsy** recommendation (molecular diagnostics, listed under Guidelines).

## Most Important Technology Advances (delta)
- **ClearPoint focused-ultrasound** platform development (preclinical BBB opening / drug delivery)
  and **Zeta** frameless AI navigation are the two technology signals; both adjacent, neither a
  direct LITT advance.

## Most Important Surgical Technique Advances (delta)
- **NEO-TACTICS** establishes neoadjuvant fractionated SRT → resection as a credible sequencing
  technique for large resectable brain mets (excellent local control, no leptomeningeal spread).
- **ROADS** validates intraoperative Cs-131 tile placement at resection as a single-stage
  local-therapy technique.

## Five Emerging Trends
1. **Local therapy at the time of resection** for operable brain mets (ROADS tiles; NEO-TACTICS
   neoadjuvant SRT) is consolidating as a competing pathway to staged post-op SRS ± salvage.
2. **Non-tissue molecular diagnosis** (CSF liquid biopsy) is entering guidelines for inoperable
   gliomas.
3. **Personalized immunotherapy** for GBM (neoantigen vaccines + checkpoint blockade) keeps
   producing propensity-matched survival signals — mechanism-adjacent to LITT's BBB-priming thesis.
4. **Intracavitary chemo is fading** (JCOG1703 negative) — local-control attention shifts to
   radiation/ablation/immune approaches.
5. **Competitor platform broadening** — incumbents (Medtronic, ClearPoint) extend geography and
   move into focused ultrasound / BBB delivery, encircling single-modality LITT.

## Five Potential Threats to LITT (delta)
1. **ROADS** — a positive phase 3 for tile brachytherapy in resectable mets competes for the same
   referrals upstream of salvage LITT.
2. **NEO-TACTICS** — neoadjuvant SRT + resection strengthens the surgery-based pathway.
3. **NCCN CSF liquid biopsy** — erodes the diagnose-and-ablate (tissue-acquisition) rationale in
   deep/inoperable lesions.
4. **ClearPoint FUS entry** — long-horizon non-thermal local-therapy / drug-delivery encroachment.
5. **Vorasidenib durability (mPFS 44.1 mo)** — further defers any local intervention in grade 2
   IDH-mutant glioma.

## Five Opportunities for LITT (delta)
1. **TRIDENT negative** — no new pressure from earlier TTFields; reinforces room for locoregional
   approaches in GBM.
2. **JCOG1703 negative** — intracavitary chemo failure repositions attention toward ablation +
   systemic/immune combinations (LITT's BBB-priming thesis).
3. **NeoVax / immunotherapy momentum** — strengthens the scientific narrative for LITT-enabled
   BBB disruption + immunotherapy (carry-through from the Feb-2026 LITT + pembrolizumab signal).
4. **ROADS/NEO-TACTICS apply to *operable* mets** — sharpen LITT messaging on the *inoperable /
   deep / SRS-refractory / radiation-necrosis* niche they do **not** address.
5. **NCCN CSF guidance** identifies a defined biopsy-infeasible population — an opening to position
   LITT (with stereotactic access) where tissue + cytoreduction are still wanted.

## Upcoming Milestones
- **TRIDENT** full dataset expected at **ASTRO 2026**.
- Peer-reviewed manuscripts for ROADS, NEO-TACTICS, JCOG1703, NeoVax (currently abstract/PR level).
- Watch **NCCN CNS** subsequent versions for any LITT-specific language.

## Trials Expected to Report Soon
- LITT-relevant pivotal trials in the database (e.g., LaSAR-BeaM, NCT07053033, LITT vs surgery +
  re-irradiation for recurrent brain mets; Tiantan multicenter brain-mets LITT) remain
  recruiting/ongoing — no in-window status change detected this run.

## Upcoming Conferences
- **ASTRO 2026** (radiation oncology; TRIDENT full data, brain-mets RT). **SNO 2026** (neuro-
  oncology). **AES 2026** (epilepsy). **CNS / AANS** (neurosurgery). Monitor for LITT, ablation,
  and competitor-platform sessions.

## Practice-Changing Studies to Watch
- **ROADS** (if it drives guideline language for resectable brain mets) and the maturing
  **INDIGO** OS data (grade 2 glioma) are the two most likely to move practice in the next 12
  months among in-window items.

## Questions Physicians Are Asking
- For a resectable large brain met, is intraoperative Cs-131 tile brachytherapy now preferable to
  post-op SRS — and where does that leave LITT?
- If CSF liquid biopsy can establish molecular diagnosis without tissue, when is a stereotactic
  biopsy (± LITT) still warranted in a deep lesion?
- Does the TTFields TRIDENT miss change anything about GBM timing? (No — maintenance-phase start
  remains standard.)

## Suggested Physician Conversation Starters
- "ROADS and NEO-TACTICS are about *operable* mets — how are you managing the deep, inoperable, or
  SRS-refractory lesions and biopsy-proven radiation necrosis those trials didn't address?"
- "With NCCN now endorsing CSF profiling when biopsy isn't feasible, how do you weigh a non-tissue
  diagnosis against obtaining tissue plus cytoreduction in one stereotactic session?"

## Common Misconceptions
- *"ROADS shows radiation beats ablation."* — ROADS compared **tile brachytherapy vs post-op SRS**
  in **resectable** mets; it did not study LITT and did not address LITT's deep/inoperable/necrosis
  niche.
- *"TRIDENT means TTFields doesn't work."* — TRIDENT tested **timing** (both arms received TTFields);
  it does not undermine TTFields efficacy versus no TTFields.

## Areas of Controversy
- Optimal local therapy for **resectable** brain metastases (tiles vs neoadjuvant SRT vs post-op
  SRS) is now genuinely contested after ROADS/NEO-TACTICS.
- Tissue vs **CSF** molecular diagnosis in inoperable glioma — and the downstream implication for
  diagnose-and-ablate workflows.

## What We Still Don't Know
- Whether ROADS-type tile brachytherapy or LITT is preferable in lesions at the boundary of
  "operable" — no head-to-head data.
- Long-term (OS) data for NEO-TACTICS and NeoVax; mature OS for INDIGO; peer-reviewed TRIDENT.
- Whether NCCN CSF guidance will reduce stereotactic biopsy volumes in practice.

## Recommended Full-Text Reading List
- ROADS (ASCO 2026 LBA2000) — once the manuscript appears.
- INDIGO extended follow-up (ASCO 2026; Cloughesy et al.).
- JCOG1703 / MACS (ASCO 2026 abstr 2001) and NEO-TACTICS (abstr 2003).
- NeoVax (ASCO 2026 abstr 2006; Dana-Farber).
- NCCN CNS Cancers v2.2026 (CSF profiling update).

## Annotated Bibliography
See per-item entries below (grouped by domain) and the References list. Each entry carries study
design, population, sample size, endpoints, results, statistical significance, limitations, a
clinical bottom line, two-axis scores, LITT direction, and a `verified`/`partial` provenance flag.

## References
See the **References** section at the end of this report.

---

# Per-publication entries (added/updated this run)

## Domain: Adjacent / competitive therapies & imaging

### ROADS phase 3 — Cs-131 tile brachytherapy (GammaTile) vs post-op SRT for resected brain metastases
- **Citation:** ROADS, ASCO 2026 Annual Meeting, LBA2000 (GT Medical Technologies).
- **Date:** 2026-05-30 · **Venue:** ASCO 2026 (late-breaking) · **Design:** multicenter randomized phase 3 (enrolled 2021–2025, 32 US centers).
- **Population:** Newly diagnosed operable brain metastases, ~2–7 cm, requiring resection. **Sample size:** ~204 patients (one outlet cited a higher N — discrepancy noted).
- **Endpoints:** Surgical-bed recurrence (primary); recurrence-or-death; overall survival; toxicity/QoL.
- **Results:** 12-mo surgical-bed recurrence ~12% (SRT) → ~1% (tiles); recurrence-or-death HR 0.42 (p=0.0024); composite recurrence-or-radiation-necrosis HR 0.32 (p=0.018); 2-yr OS 61.7% vs 35.7%; no excess radiation necrosis. **Significance:** met primary + key secondary endpoints.
- **Limitations:** open-label; abstract/PR-level (no peer-reviewed manuscript yet); comparator "SRT" not fully specified; sample-size discrepancy across sources; company-sponsored.
- **Clinical bottom line:** Intraoperative Cs-131 tiles sharply cut cavity recurrence and improved survival vs post-op SRS in resected brain mets — without added necrosis.
- **Scores:** Clinical ★4 · LITT business **5, headwind** · levers: competitive, referral · horizon ≤12mo · **partial**.
- **LITT relevance:** HEADWIND — a competing local therapy for *operable* mets that competes for upstream referrals; does **not** address LITT's deep/inoperable/necrosis niche.

### NEO-TACTICS phase 2 — neoadjuvant fractionated SRT then surgical resection for brain metastases
- **Citation:** NEO-TACTICS, J Clin Oncol 2026;44(16_suppl):2003 (ASCO 2026; Mitsuya et al.).
- **Date:** 2026-05-30 · **Venue:** ASCO 2026 · **Design:** multicenter, single-arm phase 2.
- **Population:** Resectable brain metastases. **Sample size:** single-arm cohort (per abstract).
- **Endpoints:** Local control; leptomeningeal dissemination; toxicity/radiation necrosis; neurocognition.
- **Results:** Excellent early local control; no leptomeningeal dissemination; low radiation-necrosis incidence; largely preserved neurocognition. **Significance:** single-arm, descriptive — hypothesis-generating; a randomized phase 3 is the proposed next step.
- **Limitations:** single-arm, no comparator; early follow-up; abstract-level.
- **Clinical bottom line:** Neoadjuvant fractionated SRT before resection delivers strong local control with low necrosis and no leptomeningeal spread in resectable mets.
- **Scores:** Clinical ★3 · LITT business **4, headwind** · levers: competitive, referral · horizon ≤12mo · **verified**.
- **LITT relevance:** HEADWIND (mild) — strengthens the surgery-based pathway for resectable mets.

### TTFields TRIDENT (EF-32) phase 3 — earlier TTFields in newly diagnosed GBM misses primary endpoint
- **Citation:** Novocure topline press release, 2026-06-18 (BusinessWire); full data slated for ASTRO 2026.
- **Date:** 2026-06-18 · **Venue:** corporate topline · **Design:** phase 3 randomized (Early Start at chemoradiation vs Maintenance Start).
- **Population:** Newly diagnosed glioblastoma. **Sample size:** ~981 randomized.
- **Endpoints:** Overall survival (ITT, primary).
- **Results:** Median OS 17.7 (Early) vs 17.5 mo (Maintenance); HR 0.953; p=0.519 — **primary NOT met**; durable survival both arms; no new safety signals. **Significance:** negative for the early-start hypothesis. *(OS/HR/p corroborated across CancerNetwork, GuruFocus, Simply Wall St.)*
- **Limitations:** topline corporate disclosure; not peer-reviewed; both arms received TTFields (tests timing, not TTFields vs none).
- **Clinical bottom line:** Starting TTFields earlier adds no OS benefit; maintenance-phase start remains standard.
- **Scores:** Clinical ★3 · LITT business **4, tailwind** · lever: competitive · horizon now · **verified**.
- **LITT relevance:** TAILWIND (mild) — a competitor's footprint-expansion attempt failed; GBM intensification narrative stays flat.

### NCCN CNS Cancers v2.2026 — CSF liquid biopsy for biopsy-infeasible HGG/GBM
- **Citation:** NCCN Clinical Practice Guidelines in Oncology, CNS Cancers v2.2026 (CSF tumor-derived DNA profiling update); announced via Belay Diagnostics PR 2026-06-17; corroborated by CancerNetwork, Targeted Oncology, GenomeWeb.
- **Date:** 2026-06-17 · **Venue:** NCCN guideline update · **Design:** practice guideline.
- **Population:** Biopsy-infeasible high-grade glioma / GBM; suspected diffuse midline glioma, H3 K27-altered.
- **Results:** CSF-based genomic profiling recommended when biopsy is not feasible (patient health, refusal, or tumor location), and for diagnosis/response in suspected H3 K27-altered DMG. **Significance:** guideline-level recommendation.
- **Limitations:** Vendor-announced; applies to a defined inoperable subset; not a comparative outcomes study.
- **Clinical bottom line:** A guideline-endorsed non-tissue molecular diagnostic route now exists for inoperable gliomas.
- **Scores:** Clinical ★3 · LITT business **5, headwind** · levers: referral, competitive · horizon now · **partial**.
- **LITT relevance:** HEADWIND — provides molecular diagnosis without tissue in the deep/inoperable population LITT's diagnose-and-ablate play targets.

## Domain: Neuro-oncology clinical evidence

### Vorasidenib / INDIGO — extended follow-up (UPDATE)
- **Citation:** INDIGO extended follow-up, ASCO 2026 (Cloughesy et al.); Servier release 2026-05-31; builds on Mellinghoff NEJM 2023 and FDA approval (2024-08-06).
- **Date (update):** 2026-05-31 · **Venue:** ASCO 2026 · **Design:** phase 3 RCT, extended unblinded analysis (+21.3 mo data; cutoff 2025-01-17).
- **Population:** Grade 2 IDH1/2-mutant glioma post-surgery. **Sample size:** 331 randomized (163 placebo; 144 crossed over).
- **Results:** Median PFS by BIRC now **44.1 months** (95% CI 27.7–NE); durable benefit; consistent safety; OS immature. **Significance:** extension of the previously significant PFS benefit.
- **Change note:** Median PFS deepened from 27.7 → 44.1 mo with longer follow-up.
- **Clinical bottom line:** Longer follow-up confirms vorasidenib durably delays progression in grade 2 IDH-mutant glioma.
- **Scores:** Clinical ★5 (item) · LITT business **6, headwind** · levers: referral, utilization · horizon now · **partial**.
- **LITT relevance:** HEADWIND — durable drug-first benefit further defers local intervention in this subgroup.

### JCOG1703 (MACS) phase 3 — carmustine wafers add no survival benefit in resected GBM (negative)
- **Citation:** JCOG1703 (MACS), J Clin Oncol 2026;44(16_suppl):2001 (ASCO 2026).
- **Date:** 2026-05-31 · **Venue:** ASCO 2026 · **Design:** multicenter randomized phase 3 (38 institutions); carmustine wafer + chemoRT/TMZ vs chemoRT/TMZ alone.
- **Population:** Newly diagnosed, maximally resected (≥90%) GBM.
- **Results:** Carmustine wafers did **not** improve OS or PFS vs standard chemoRT. **Significance:** negative trial.
- **Limitations:** Abstract-level; details pending manuscript.
- **Clinical bottom line:** Intracavitary carmustine wafers add no survival benefit in maximally resected GBM.
- **Scores:** Clinical ★3 · LITT business **3, tailwind** · lever: competitive · horizon now · **partial**.
- **LITT relevance:** TAILWIND (mild) — a competing intracavitary local therapy fails, shifting local-control attention elsewhere.

### NeoVax phase 1 — personalized neoantigen vaccine + pembrolizumab in newly diagnosed GBM
- **Citation:** NeoVax, J Clin Oncol 2026;44(16_suppl):2006 (ASCO 2026; Reardon et al., Dana-Farber).
- **Date:** 2026-05-30 · **Venue:** ASCO 2026 (oral) · **Design:** phase 1.
- **Population:** Newly diagnosed GBM (up to 20 patient-specific neoantigen peptides + poly-ICLC after RT, + pembrolizumab).
- **Results:** MGMT-methylated mOS 36.9 vs 25.3 mo (propensity-matched SOC controls); unmethylated 19.0 vs 16.7 mo; durable tumor-trafficking T-cell responses. **Significance:** propensity-matched comparison — encouraging, not randomized.
- **Limitations:** Phase 1; historical/propensity-matched controls; small.
- **Clinical bottom line:** Personalized neoantigen vaccination + checkpoint blockade generated durable anti-tumor immunity and encouraging survival in newly diagnosed GBM.
- **Scores:** Clinical ★3 · LITT business **2, neutral** · lever: messaging · horizon 2-5yr · **verified**.
- **LITT relevance:** NEUTRAL — mechanism-adjacent to LITT's immunotherapy-priming thesis but not LITT-specific.

### Lucicebtide (ST101) phase 2 window-of-opportunity update — newly diagnosed GBM
- **Citation:** Sapience Therapeutics release 2026-05-21; poster, CNS Tumors, ASCO 2026 (Jun 1). C/EBPβ antagonist.
- **Date:** 2026-05-21 · **Venue:** ASCO 2026 (poster) / company PR · **Design:** single-arm phase 2 window-of-opportunity.
- **Population:** Newly diagnosed GBM. **Sample size:** 9 (efficacy cohort).
- **Results:** Projected median PFS ~28.4 mo; median OS not reached with 6/9 alive; favorable safety. No randomized comparator. **Significance:** none formal — hypothesis-generating.
- **Limitations:** n=9, single-arm, no control, company-reported, projections not mature events.
- **Clinical bottom line:** Early single-arm signal for a C/EBPβ antagonist + chemoRT — too small to change practice; watch.
- **Scores:** Clinical ★2 · LITT business **1, neutral** · lever: messaging · horizon 2-5yr · **partial**.
- **LITT relevance:** NEUTRAL — systemic-pipeline asset, no direct LITT bearing.

## Domain: Regulatory & device landscape

### Medtronic Stealth AXiS — CE Mark (EU) (UPDATE)
- **Citation:** Medtronic Newsroom, 2026-04-28; corroborated by MassDevice, Ortho Spine News, PRNewswire.
- **Date (update):** 2026-04-28 · **Type:** CE Mark (EU market authorization), spine + cranial.
- **Change note:** EU authorization of the integrated planning + StealthStation navigation + Mazor-derived robotics platform; geographic expansion distinct from the 2026-03-27 US cranial/ENT clearance.
- **Clinical bottom line:** Medtronic globalizes its cranial navigation+robotics stack, deepening the ecosystem around Visualase LITT.
- **Scores:** Clinical ★1 · LITT business **7, headwind** · lever: competitive · horizon ≤12mo · **verified**.
- **LITT relevance:** HEADWIND — reinforces a bundled cranial-ecosystem moat a single-modality LITT specialist cannot match alone.

### Zeta Surgical — FDA 510(k) (K253663) navigation + navigated instruments
- **Citation:** Zeta Surgical PR 2026-05-01 (PRNewswire); corroborated by NeuroNews, MassDevice, Practical Neurology.
- **Date:** 2026-05-01 · **Type:** FDA 510(k) clearance · **Product:** Zeta Navigation System + Zeta Stylet / Zeta Bolt.
- **Results:** Frameless, AI-assisted navigation cleared for brain biopsy, hydrocephalus, trigeminal neuralgia.
- **Clinical bottom line:** A new frameless AI navigation + biopsy entrant in the lane adjacent to LITT planning/biopsy.
- **Scores:** Clinical ★1 · LITT business **4, neutral** · lever: competitive · horizon ≤12mo · **verified**.
- **LITT relevance:** NEUTRAL — incremental navigation/biopsy competition; not a LITT device.

### ClearPoint Neuro — 10-year focused-ultrasound / BBB-delivery partnership (Sungkyunkwan Univ.)
- **Citation:** ClearPoint Neuro PR 2026-05-27; corroborated by BioSpace, StockTitan.
- **Date:** 2026-05-27 · **Type:** strategic R&D partnership + preclinical proof-of-concept.
- **Results:** 10-yr FUS development deal; preclinical IV large-molecule delivery across the BBB via a ClearPoint FUS prototype integrated with its navigation/robotics; targets OR use outside the MRI suite.
- **Clinical bottom line:** A LITT competitor formally expands into focused-ultrasound BBB opening / drug delivery.
- **Scores:** Clinical ★1 · LITT business **3, headwind** · levers: competitive, pipeline · horizon 2-5yr · **verified**.
- **LITT relevance:** HEADWIND (long-horizon) — competitor platform encroachment into non-thermal local therapy / drug delivery.

### ClearPoint Neuro — Q1 2026 financial results
- **Citation:** ClearPoint Neuro Q1 2026 earnings, 2026-05-13 (StockTitan).
- **Date:** 2026-05-13 · **Type:** corporate earnings.
- **Results:** Revenue ~$12.1M, +43% YoY (per release). **Significance:** commercial momentum for a LITT-adjacent competitor.
- **Clinical bottom line:** A LITT-adjacent competitor is growing revenue briskly.
- **Scores:** Clinical ★1 · LITT business **3, neutral** · lever: competitive · horizon now · **verified**.
- **LITT relevance:** NEUTRAL — competitive context, not a clinical/device action.

---

## References

- ROADS (ASCO 2026, LBA2000): https://ascopost.com/news/june-2026/implanted-cesium-131-tiles-improve-local-control-and-survival-in-patients-with-resected-brain-metastases/ ; https://www.prnewswire.com/news-releases/roads-phase-3-clinical-trial-data-presented-at-asco26-show-gammatile-provides-superior-tumor-control-leading-to-patients-living-longer-without-recurrence-compared-to-standard-of-care-in-newly-diagnosed-operable-brain-metastases-302786198.html
- NEO-TACTICS (ASCO 2026, abstr 2003): https://ascopubs.org/doi/10.1200/JCO.2026.44.16_suppl.2003
- TRIDENT (Novocure topline, 2026-06-18): https://investor.novocure.com/news-releases/news-release-details/novocure-announces-topline-data-phase-3-trident-trial-evaluating
- NeoVax (ASCO 2026, abstr 2006): https://ascopubs.org/doi/10.1200/JCO.2026.44.16_suppl.2006
- JCOG1703 / MACS (ASCO 2026, abstr 2001): https://ascopubs.org/doi/10.1200/JCO.2026.44.16_suppl.2001
- INDIGO extended follow-up (ASCO 2026; Servier, 2026-05-31): https://servier.mediaroom.com/2026-05-31-Servier-to-Present-Extended-Follow-Up-Results-from-the-Phase-3-INDIGO-Trial-Showing-Durable-and-Sustained-Treatment-Benefits-of-VORANIGO-R-vorasidenib-at-ASCO-2026
- NCCN CNS Cancers v2.2026 (CSF profiling; Belay PR 2026-06-17): https://www.prnewswire.com/news-releases/belay-announces-update-to-nccn-guidelines-to-recommend-csf-based-genomic-profiling-in-biopsy-infeasible-high-grade-gliomas-302803204.html
- Lucicebtide (ST101) (Sapience, 2026-05-21): https://www.prnewswire.com/news-releases/sapience-therapeutics-provides-positive-data-update-from-phase-2-trial-of-lucicebtide-plus-soc-in-patients-with-glioblastoma-at-the-2026-american-society-of-clinical-oncology-asco-annual-meeting-302779105.html
- Medtronic Stealth AXiS CE Mark (EU, 2026-04-28): https://news.medtronic.com/2026-04-28-Medtronic-announces-CE-Mark-for-Stealth-AXiS-TM-surgical-system
- Zeta Surgical 510(k) (2026-05-01): https://www.prnewswire.com/news-releases/zeta-surgical-receives-fda-510k-clearance-expanding-access-to-brain-tumor-biopsies-hydrocephalus-and-trigeminal-neuralgia-302760338.html
- ClearPoint Neuro FUS partnership (2026-05-27): https://www.biospace.com/press-releases/clearpoint-neuro-enters-into-10-year-focused-ultrasound-development-partnership-with-sungkyunkwan-university-south-korea-further-expanding-our-drug-delivery-ecosystem-and-global-footprint
- ClearPoint Neuro Q1 2026 (2026-05-13): https://www.stocktitan.net/news/CLPT/clear-point-neuro-reports-first-quarter-2026-ikpfdd0o41q8.html

---

### Rejected near-misses (verified out-of-window — do not re-surface as in-window)
- LITT / BBB-permeability mechanistic paper (Neuro-Oncology advance access) — 2026-04-13 (pre-window; preclinical).
- RNS Post-approval Study, 3-yr efficacy (Neurology) — online 2026-04-24 (3 days pre-window).
- MB-FUS + temozolomide for HGG (Lancet Oncology, BT008NA) — late 2025 (pre-window).
- HH stereotactic RF ablation long-term (Epilepsia) — 2025-10-01. Corpus callosotomy series (Epilepsia) — 2025-11-22.
- GBM immunotherapy-failure meta-analysis (Critical Reviews in Oncology) — online 2026-03-14 (pre-window).
