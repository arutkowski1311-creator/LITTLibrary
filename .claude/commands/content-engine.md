---
description: Draft LinkedIn + Epilepsy Collab + Brain Tumor Collab posts from the evidence library (scans first if stale)
argument-hint: "[full|draft|scan]  [channel: all|personal|epilepsy|tumor]  (default: full all)"
allowed-tools: Read, Write, Edit, Bash, WebSearch, WebFetch, Agent, Glob, Grep
---

You are running the **Content Creation Engine** defined in `docs/content-creation-engine.md`.
It turns verified findings from the Clinical Intelligence Engine (`database.json`) into
review-ready social posts for three channels: the author's **personal LinkedIn**, the
**Epilepsy Collab**, and the **Brain Tumor Collab**.

## Step 0 — Setup

1. Read `docs/content-creation-engine.md` in full. It governs source rules, the Conversation
   Score, post anatomy, formats, guardrails, and output. Also skim
   `content/collab-growth-playbook.md` for each Collab's positioning and voice.
2. Read `reports/STATE.json` (last scan date), `content/ledger.json` (what has already been
   drafted/posted, per channel), and `content/calendar.json` (upcoming anchors).
3. Today's date: use the date in context or `date +%F`.
4. Resolve arguments:
   - Mode `$1`: `full` (default) = scan if stale, then draft; `draft` = draft only from the
     current library; `scan` = refresh the library and calendar only, no drafts.
   - Channel `$2`: `all` (default), `personal`, `epilepsy`, or `tumor`.
   State the resolved mode, channels, and the library's last scan date before proceeding.

## Step 1 — Freshness (mode `full` or `scan`)

If `reports/STATE.json → lastRunDate` is more than **14 days** before today, refresh the
library first by following `.claude/commands/clinical-scan.md` Steps 1–3 (research fan-out,
appraisal, merge into `database.json` with dedup) for the window **lastRunDate → today**.
In addition to the library schema, ask each research agent to return two content fields per
item: `contentAngle` (the vendor-neutral clinical "so what") and `discussionQuestion` (one
open question for clinicians). Keep those two fields out of `database.json`; carry them into
this run's drafts instead.

Record the run in `database.json → runs` and `reports/STATE.json → history` (mode
`surveillance`), refresh the offline builds (`python3 scripts/build_standalone.py`), and
update `reports/README.md`. Also refresh `content/calendar.json` with verified dates for the
next ~9 months of society meetings and awareness days.

## Step 2 — Candidate pool

From `database.json → items`, keep items that:
- are `verified` (or `partial`, if only verified figures will be quoted and the post frames
  them as preliminary) — never `unverified`;
- are not already in `content/ledger.json` for the target channel with status `drafted`,
  `hold`, `approved`, or `posted` (the same item may return on a channel only with a material
  `changeNote`, and the post must lead with what changed);
- prefer items first seen in the latest scan, then older items with a fresh angle (a
  calendar anchor, a new related study, a common misconception).

Use **physician-safe fields only** (spec §1). Do not read business-impact fields into drafts.

## Step 3 — Score & route

Apply the Conversation Score (spec §2). Default batch size:
- **Personal LinkedIn:** 3 posts (the batch's strongest items, either domain).
- **Epilepsy Collab:** 3 clinical posts + 1 community post.
- **Brain Tumor Collab:** 3 clinical posts + 1 community post.
Rotate formats (spec §5); no channel gets the same format twice in a row, including the last
post recorded for that channel in the ledger.

## Step 4 — Draft

For each post, follow the post anatomy (spec §3) and channel voice (spec §7). Produce:
- **Hook A / Hook B** variants
- The full post body (LinkedIn), and a 1–3 post X/Bluesky thread for Collab posts
- Suggested first comment (source link + one extra data point or counter-study)
- 0–2 hashtags, a disclosure line where spec §6 requires it
- A visual suggestion (carousel outline, simple chart, or "text only")
- A target post date that respects cadence (spec §7) and calendar anchors

## Step 5 — Guardrail check (every post)

Re-read each draft against spec §6 and record a checklist:
`numbers match source` · `design + n stated` · `limitation stated` · `no unverified figure` ·
`vendor-neutral / on-label` · `disclosure present if needed` · `no patient info` ·
`no advice / no solicitation` · `question is open`. Rewrite or drop any post that fails.

## Step 6 — Write, log, commit

1. Write `content/<YYYY-MM-DD>-batch.md` (spec §8 layout), grouped by channel, with a short
   header: date, library size, scan window used, items considered / drafted.
2. Append each post to `content/ledger.json` with `status: "drafted"`.
3. Update `content/README.md`'s batch index.
4. Commit on the current branch with a clear message and push (`git push -u origin <branch>`).
   Do **not** open a pull request unless asked.
5. Reply with: posts drafted per channel, each post's hook A (one line each), anything
   dropped at the guardrail step and why, and the batch file path.
