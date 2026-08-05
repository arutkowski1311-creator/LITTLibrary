# Clinical Story Engine — Strategy & Platform Blueprint

> The goal is not "send a nice email." It is **changing prescribing behavior** —
> one of the hardest problems in healthcare. An email is a single touchpoint in a
> longer educational sequence. This document is the blueprint for turning an email
> editor into a **physician behavior-change platform.**

## 1. Why a template editor isn't the product

Prescribing habits are driven by habit/familiarity, clinical guidelines, personal
experience, peer influence, formulary & coverage, safety concerns, and workflow
convenience. No single email moves those. What moves them is a **sequence** that
builds clinical rationale *before* it asks for anything.

So the unit of value is the **campaign across the prescribing journey**, not the
individual email.

## 2. The prescribing journey (the spine of every campaign)

| Stage | Physician mindset | Content | CTA posture |
|---|---|---|---|
| **1 · Awareness** | "I wasn't aware this was an option." | Disease burden, unmet need, new approval, guideline update, MOA. **One clinical message only.** | Soft — invite to learn. No prescribing ask. |
| **2 · Consideration** | "Maybe this deserves a look." | Head-to-head data, differentiation, safety, patient selection, a case. | Medium — review the data/a case. |
| **3 · First prescription** | (remove friction) | Appropriate patients, dosing, coverage, contraindications, pharmacy access, copay. | Direct — access & dosing resources. |
| **4 · Reinforcement** | (make it stick) | Real-world evidence, new publications, guideline updates, expert commentary, FAQs. | Reinforcing. |

**Built:** the Story Engine intake tags each email with its stage and shows the
stage's goal, content rule, and correct CTA posture, so no email over-asks.

## 3. Story structures (content archetypes)

Layouts control *how it looks*; structures control *how it argues*. Both are in
the builder. The four clinical structures:

- **Publication** — clinical headline → key finding → one figure → why it matters → link to paper.
- **Patient case** — presentation → treatment decision → outcome → practice takeaway.
- **Guideline update** — what changed → supporting evidence → clinical implications → suggested population.
- **Myth vs evidence** — common misconception → current evidence → practical takeaway. (Builds credibility rather than reading as promotional.)

The engine recommends a structure from **stage + objective + available evidence**;
the marketer can accept it or override.

## 4. Worked sequences (seeded as presets)

### Pivya (pivmecillinam) — new entrant in a crowded uUTI space
Clinicians have longstanding habits around nitrofurantoin, TMP-SMX, cephalexin,
and fluoroquinolones. "New antibiotic" is not enough. Build the rationale first:

1. Are uncomplicated UTIs becoming harder to treat? *(Awareness — unmet need)*
2. Why were new oral antibiotics developed? *(Awareness → Consideration)*
3. Which patients are appropriate candidates for Pivya? *(Consideration)*
4. Clinical trial efficacy and safety summary. *(Consideration — Publication)*
5. Where does Pivya fit alongside IDSA recommendations & stewardship? *(Consideration → First Rx — Guideline)*

None of the early emails asks for a prescription.

### Cipro (ciprofloxacin) — reinforce *appropriate* use
Physicians already know it but have grown selective due to stewardship and FDA
fluoroquinolone safety warnings. Messaging reinforces appropriate use — patient
selection, infection types, when alternatives are preferred, resistance,
stewardship — which builds credibility instead of appearing promotional.

> Presets seed structure and framing only. **They never invent clinical claims** —
> every efficacy/safety line is a placeholder for MLR-approved, verbatim language.

## 5. From drip to a *learning* campaign (adaptive sequencing)

A static drip sends the same next email to everyone. A learning campaign chooses
the next email from what the physician engaged with:

| Signal | Next action |
|---|---|
| Opened, didn't click | Shorter follow-up, one key graphic |
| Clicked **safety** content | Next email → tolerability / adverse-event profile |
| Clicked **efficacy** content | Next email → deeper comparative outcomes |
| Registered for a webinar | Follow up with recording + additional evidence |
| No engagement after N touches | Pause or switch educational angle — don't repeat |

**Where this runs:** the branching *rules* are authorable here (see §7 roadmap:
Sequence & Branching Planner, exported as a spec/JSON). The *execution* — reading
per-recipient opens/clicks and firing the next send — runs in the **ESP/marketing
automation** (Salesforce Marketing Cloud, Veeva, Marketo, etc.), because only the
sending platform holds per-recipient engagement data.

## 6. The biggest opportunity: physician adoption scoring

Most pharma platforms optimize opens/clicks. Alembic's real question is different:

> **Which physicians are moving from awareness toward prescribing?**

Score each physician on a weighted blend of engagement, where later-funnel content
counts more:

```
adoption_score =
    w1 · engaged_with_efficacy_data
  + w2 · engaged_with_safety_info
  + w3 · engaged_with_patient_selection
  + w4 · engaged_with_access_resources     // strongest intent signal
  + w5 · webinar / rep-meeting requests
  - w6 · sustained_non_engagement
```

Then **surface the movers to the field team** so medical affairs, marketing, and
sales coordinate around the physicians most likely to adopt. That is the shift
from an *email editor* to a *behavior-change platform*.

**Requires (backend, not a static file):** ESP engagement webhooks + CRM/CRM
(Veeva) identity resolution + a scoring service + a rep-facing dashboard. Privacy
note: individual-HCP behavioral tracking is a consent/MLR decision, and open-rate
signals are unreliable post-Apple-MPP — weight **clicks and requests**, not opens.

## 7. What's built vs. what's next

**Built now (self-contained, in `index.html`):**
- 10 templates — 6 layouts + 4 clinical story structures.
- Clinical Story Engine intake (product, specialty, stage, objective, evidence)
  with a structure recommendation and stage-appropriate CTA guidance.
- Pivya & Cipro starters.
- UTM tagging incl. `utm_content = journey stage` for stage-level analytics.
- All legal guardrails (verbatim text, unaltered images, fair-balance export lock).

**Next (clearly scoped):**
1. **Sequence & Branching Planner** — lay out a multi-stage campaign with the §5
   branching rules; export a human-readable + JSON spec to configure in the ESP.
2. **Adoption-scoring dashboard** (mockup → service) — the §6 model, with a
   rep-facing view of "physicians moving toward adoption."
3. **ESP/CRM integration** — the backend that turns the planner + scoring specs
   into live adaptive campaigns and real scores.

The email builder is step 1 of a platform, not the platform. This document is the
map from here to there.
