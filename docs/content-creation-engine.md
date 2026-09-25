# Content Creation Engine for Brain Surgery (Tumors & Epilepsy)

**System Specification — Version 1.0**

> Like the Clinical Intelligence Engine, this is a *specification*, not a one-off prompt.
> It defines how verified clinical intelligence becomes social content **every time** it
> runs, across three channels, so the voice, accuracy bar, and guardrails stay constant.

---

## Mission

Turn the library's verified evidence into posts that make clinicians **stop, think, and
reply** — building a reputation for the author and a community for two physician
collaboratives:

| Channel | Who is speaking | Audience | Job |
| --- | --- | --- | --- |
| **Personal LinkedIn** | The author, first person | Neurosurgeons, epileptologists, neuro-oncologists, rad/med onc, APPs, industry & medical-affairs peers | Credibility: the person who reads the literature so you don't have to, and asks the question in the room |
| **Epilepsy Collab** (LinkedIn page + X/Bluesky) | "We" — the collaborative | Epilepsy surgeons & epileptologists in a shared catchment area | Shorten the path from drug-resistant epilepsy to a surgical conversation; fill regional meetings |
| **Brain Tumor Collab** (LinkedIn page + X/Bluesky) | "We" — the collaborative | Neurosurgery, neuro-onc, med onc, rad onc, neuroradiology, neuropath, APPs, navigators, rehab/palliative | Make the handoffs between specialties visible and better; fill regional meetings |

The content engine does **not** find evidence. It reads what the Clinical Intelligence
Engine has already found and verified (`database.json`), and runs a surveillance scan first
when the library is stale.

---

## Guiding Principle

Every post must pass one test:

> *"Would a busy clinician learn something true in the first two lines, and have a reason
> to answer the question at the end?"*

A post that only informs is a newsletter. A post that only asks is noise. The engine's posts
**inform, interpret, then open a door**.

---

## Pipeline

```
database.json (verified findings)
   │  1. Freshness check → stale (>14 days since last scan)? run surveillance first
   ▼
2. Candidate pool  — physician-safe fields only, not yet posted (content/ledger.json)
   ▼
3. Conversation Score → rank & route to channels
   ▼
4. Draft — post anatomy + format + channel voice (2 hook variants each)
   ▼
5. Guardrail check — accuracy, neutrality, compliance (every post, every time)
   ▼
6. Batch file content/<date>-batch.md  +  ledger update  →  human review → post
```

Nothing is published automatically. The engine produces **review-ready drafts**; the author
approves, edits, and posts (or loads them into a scheduler).

---

## 1. Source rules

- **Physician-safe fields only.** Draft from: `title`, `citation`, `url`, `date`, `venue`,
  `studyDesign`, `population`, `sampleSize`, `endpoints`, `results`, `significance`,
  `limitations`, `evidenceStrength`, `clinicalBottomLine`, `indications`, `verified`,
  `changeNote`. **Never** draft from `littBusinessImpact`, `littBusinessDirection`,
  `businessLevers`, `strategies`, `competitiveImpact`, `whyMatters`, or `whoShouldKnow` —
  the same fields the physician view hides. Business intelligence stays internal.
- **Provenance gates what can be said.**
  - `verified` → may be posted with its figures.
  - `partial` → may be posted only if framed as preliminary, and only the verified parts are
    quoted; the unverified figure is left out.
  - `unverified` → **never** posted.
- **Primary source always.** Link the paper, trial registration, FDA database entry, or
  guideline — never a press release or news story as the authority.
- **Dated.** Every post names when the evidence appeared (e.g., "published this month in
  *Epilepsia*"). Old landmark papers are fine, but say they are old and say why they matter now.

---

## 2. Conversation Score (selection & routing)

Rank candidates with four quick judgments (each 0–3), and use the total to decide what gets
drafted this batch. This is an editorial judgment, like the Clinical Impact rubric — not a
formula to game.

| Factor | 0 | 3 |
| --- | --- | --- |
| **Clinical weight** | ★1–2 | ★4–5 |
| **Debate potential** | Everyone already agrees | Reasonable experts would answer differently |
| **Cross-specialty reach** | One specialty cares | It changes a handoff between 2+ specialties |
| **Freshness** | >12 months, no new angle | Published/announced in the last 30 days |

**Routing**

- Epilepsy items → **Epilepsy Collab**; tumor items → **Brain Tumor Collab**.
- The top 2–3 items of the batch, from either domain → **Personal LinkedIn**.
- An item may appear on more than one channel only with a **different angle** (e.g., personal
  = "what surprised me"; Collab = "how would our region handle this?"). Never cross-post the
  same text.
- Items about regulation, payment, or industry deals go to Personal LinkedIn only, if at all,
  and only with a clinical angle. Collab channels stay clinical and vendor-neutral.

---

## 3. Post anatomy

Every post, every channel:

1. **Hook (first ~2 lines, under ~200 characters).** This is all most readers see before
   "…see more". Lead with the surprising number, the tension, or the question — not with
   "Excited to share" or the journal name.
2. **The finding, plainly.** What was studied, in whom, how (design + n), and the headline
   result with its real number.
3. **The interpretation.** What it changes — or doesn't — and label it honestly as
   *established*, *promising*, or *speculative*.
4. **The catch.** One limitation, stated fairly. Nothing builds clinical credibility faster.
5. **The open question.** One specific, answerable-from-experience question (see §4).
6. **Source.** Full citation (journal, year, DOI) in the post, so readers can find it even
   without a link. Link placement per channel notes (§7).
7. **Hashtags.** 0–2, specific (`#EpilepsySurgery` beats `#Healthcare`). LinkedIn no longer
   lets members follow hashtag feeds, so tags help discovery only marginally.
8. **Disclosure** where required (see §6).

Length: Personal LinkedIn 120–250 words. Collab LinkedIn 80–180 words. X/Bluesky: a 1–3 post
thread, ≤280 characters each.

---

## 4. Questions that start dialogue

The closing question is the engine's most important sentence. Good ones:

- **Ask about practice, not opinion of the paper.** "At what point in your clinic does a
  second failed ASM trigger a surgical referral?" beats "Thoughts?"
- **Force a trade-off.** "If you could only add one person to your tumor board — a
  neuroradiologist or a navigator — who would it be?"
- **Invite the other specialty.** "Rad oncs: does this change how you think about timing
  after resection?" Cross-specialty replies are the Collabs' whole point.
- **Ask for the exception.** "Where does this *not* apply in your patients?"
- **Poll when the answer is a choice.** 2–4 options, one clinical variable.

Avoid: leading questions that only have one polite answer, questions that invite patients to
share their medical details, and anything that reads as soliciting referrals or product
opinions.

**After posting:** reply to every substantive comment in the first hour; add a follow-up
comment with one extra data point or a counter-study; tag study authors only when the post
fairly represents their work.

---

## 5. Formats (content pillars)

| Format | What it is | Best channel |
| --- | --- | --- |
| **The Breakdown** | One new paper, anatomy above | Personal, both Collabs |
| **Two Studies, One Question** | Two findings in tension; ask which one wins in practice | Personal |
| **The Handoff** | A finding framed around where specialty A hands to specialty B | Brain Tumor Collab |
| **The Referral Gap** | A number about delay/underuse + "what would shorten it in our region?" | Epilepsy Collab |
| **Myth vs. Data** | A common belief, then the evidence | Personal, Collabs |
| **Practice Poll** | A single-variable practice-pattern poll, results recapped a week later | All |
| **Conference Dispatch** | 3 takeaways from AES / SNO / CNS / ASTRO / AANS with one question | All |
| **Numbers That Matter** | One statistic, 5–7-slide document/carousel | Collabs |
| **Hypothetical Case** | A composite, clearly fictional case: "How would your team handle…?" | Collabs |
| **Community** | Meeting announcements, recaps, member spotlights, calls for cases | Collabs |

Rotate formats; no channel runs the same format twice in a row.

---

## 6. Guardrails (non-negotiable)

**Accuracy**
- Every number traces to the primary source and matches it exactly (units, arm, timepoint).
- State the study design and n. Distinguish association from causation.
- No figure from a `partial` or `unverified` field; no rounding that flatters a result.

**Neutrality & compliance**
- **Vendor-neutral by default.** Talk about techniques and categories ("laser ablation",
  "responsive neurostimulation"), not brands, unless a brand is the news (e.g., an FDA action)
  — and then report it plainly with no superiority claim.
- **On-label only for products.** Don't describe uses of a specific device or drug beyond its
  cleared/approved indications. Discussing published science on a *technique* is fine;
  endorsing a *product* for an unapproved use is not.
- **Disclose affiliation.** If the author works for, consults for, or holds equity in a
  company whose product is in the post's subject area, the post says so plainly (for example,
  "Disclosure: I work in the neurosurgical device industry. Views are my own."). The profile
  headline alone is not enough on posts that touch the employer's field.
- **Collab channels carry no industry messaging.** If a Collab receives industry support, say
  so on the website and on meeting materials.
- **No patient information.** No identifiable details, images, or "a patient I saw" stories
  without documented consent. Hypothetical cases are composites and labeled as such.
- **Not medical advice.** Posts are for clinicians. When patients comment asking for advice,
  reply kindly that you can't advise on individual care and point them to their care team or
  the Epilepsy Foundation / National Brain Tumor Society resources.
- **No referral solicitation, no gifts, no inducements** in post copy.

**Tone** (inherits the Clinical Intelligence Engine's tone rules)
- Balanced, evidence-based, curious. Skeptical of your own side.
- Never overstate. "Suggests" when it suggests; "shows" only when it shows.
- No hype words: *game-changer, revolutionary, breakthrough* (unless quoting the FDA
  designation name).

A post that fails any guardrail is not "fixed later". It is rewritten or dropped.

---

## 7. Channel notes

**Personal LinkedIn**
- First person, reflective: "What struck me…", "The number I can't stop thinking about…"
- 2–3 posts per week, Tuesday–Thursday, 10 am–12 pm in the audience's time zone.
- Link placement: third-party analyses (2025–2026) report that body links cut reach and that
  the first-comment workaround may no longer help; LinkedIn publishes no official figure.
  Default: citation + DOI in the post, link in the first comment, and **track reach both ways**
  in the ledger's `engagement` notes until the data says otherwise.
- Formats: document/carousel (PDF) posts had the highest engagement in large 2024–2025
  analyses; use them for Numbers That Matter and Conference Dispatch. Substantive comment
  threads and dwell time matter more than likes.

**Epilepsy Collab & Brain Tumor Collab**
- "We", practical, regional: "What would it take for our region to…?"
- 2 clinical posts per week each, plus community posts (meetings, recaps, spotlights).
- Every clinical post ends with a question **and** a light path to the community: "We'll put
  this on the agenda for the next regional meeting — reply if you want to present."
- Mirror to X and Bluesky as a short thread (much of the medical/science community moved to
  Bluesky in late 2024); LinkedIn is the primary channel.
- Sign-ups go through the Collab website and the page's Featured section. An owned email list
  is the hedge against shrinking organic reach.

---

## 8. Output

Each run writes `content/<YYYY-MM-DD>-batch.md` containing, per post:

- Channel, format, target post date, source item `id`(s) and citation
- **Hook A / Hook B** (test variants), then the full post body
- Suggested first comment (source link + one extra data point)
- Hashtags, disclosure line (if needed)
- Visual suggestion (e.g., "5-slide carousel: slide 1 = the 60% stat")
- Guardrail checklist result (✓ each line)

and updates `content/ledger.json`:

```json
{ "id": "2026-09-25-li-01", "channel": "personal-linkedin", "format": "breakdown",
  "sourceIds": ["<database item id>"], "draftedRun": "2026-09-25",
  "status": "drafted | approved | posted | dropped", "postedDate": null, "postUrl": null,
  "engagement": null }
```

The ledger is how reruns avoid re-posting the same finding on the same channel. The author
(or Claude, when told) flips `status` to `posted` and fills `postedDate` / `postUrl`;
engagement notes feed back into which formats and question styles get used more.

---

## 9. Calendar anchors

Plan around moments the audience is already talking about. Recurring anchors:

| When | Anchor | Channel emphasis |
| --- | --- | --- |
| 2nd Monday of February | International Epilepsy Day | Epilepsy Collab |
| March 26 | Purple Day (epilepsy awareness) | Epilepsy Collab |
| May | Brain Tumor Awareness Month | Brain Tumor Collab |
| June 8 | World Brain Tumour Day | Brain Tumor Collab |
| Third Wednesday of July | Glioblastoma Awareness Day (US) | Brain Tumor Collab |
| November | National Epilepsy Awareness Month (US) | Epilepsy Collab |
| Society meetings | AES (Dec), SNO (Nov), CNS (fall), ASTRO (fall), AANS (spring), ASCO (June) | Conference Dispatch posts on all channels |

Exact dates and locations for each cycle live in `content/calendar.json`, refreshed each run.

---

## 10. Collaborative growth

Positioning, launch sequence, meeting promotion, advertising copy, targeting, and KPIs for
the Epilepsy Collab and the Brain Tumor Collab live in
[`../content/collab-growth-playbook.md`](../content/collab-growth-playbook.md). That playbook
follows the guardrails above; advertising copy uses only verified, cited numbers.

---

*This engine produces draft educational content for clinicians. It does not provide medical
advice, and it does not replace the primary literature or clinical judgment.*
