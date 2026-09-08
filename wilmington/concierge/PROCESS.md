# Concierge engine — data and the monthly vetting cycle

`places.json` is the single source of record for every recommendation the guest site shows:
dining, skiing, hiking, biking, fishing, sightseeing, children, rainy-day, groceries, emergency,
guides & outfitters. The site never carries its own copy; `site/build.py` injects this file
at build time. Owner research (the 2026 restaurant guide, forthcoming activity rankings) and our
own checks both land here, and nothing reaches a guest that is not in this file.

## What every entry carries (GUE-02)

| Field | Meaning |
| --- | --- |
| `category`, `subcategory`, `area`, `drive` | Where it sits in the guide and how far from the property |
| `rank`, `areaRank`, `rankScope`, `occasionPick` | Editorial ranking from owner research; `occasionPick` powers the "fast picks" |
| `review`, `bestFor`, `order`, `knowBefore` | The recommendation itself, in our words |
| `signals` | Third-party snapshot: Google rating, review count, and the date it was read |
| `season`, `hours`, `cost`, `booking`, `access`, `suits`, `flags` | Practical facts; `suits` drives the itinerary builder |
| `source` | Where the facts came from, with a reference key and URL |
| `verification` | `lastVerified`, `verifiedBy`, `method`, `nextReview`, `status` |
| `status` | `active`, `placeholder`, `closed`, `removed` |

## Freshness rules (enforced by the site and by `vet.py`)

| Days since `lastVerified` | Guest sees | Register shows |
| --- | --- | --- |
| 0–45 | Entry with "checked <date>" | — |
| 46–90 | Entry, marked "recheck due" | Due |
| > 90 since a check | Hidden from guests | Overdue |
| Never verified | Shown, marked "verify before publishing" (preview builds only; a launch gate) | Unverified |
| `status: closed` | Hidden immediately | Closed (kept for history) |

Cadence values live in `meta.cadence` and can be tightened per season.

## The monthly cycle

1. **Day 1 — worksheet.** `python3 vet.py worksheet` writes `reviews/YYYY-MM-worksheet.md`: one checklist
   per entry due, grouped by category, ranked entries first.
2. **Days 1–5 — checks.** For each entry, in this order of authority: official website or a phone call →
   regional tourism board (ROOST, whitefaceregion.com, saranaclake.com, lakeplacid.com) → Google
   listing → recent review themes. Confirm: still open; season and hours; phone and website; price band;
   the *what to order* items; reservation / cash-only / kids / dog notes; rating and volume drift; any
   closure, hazard or event in the next 60 days. Never write a specific hour, price or menu item from memory.
3. **Day 5 — apply.** Record outcomes in a `results.json` (format in `vet.py`) and run
   `python3 vet.py apply results.json`. Verified entries roll `nextReview` forward 30 days; anything
   that could not be verified is re-queued in 7 days and drops out of the guest view after 90.
4. **Day 5 — publish.** `python3 ../site/build.py` (embeds photos and this data), commit, push, republish
   the artifact. The publishing register on the site lists whatever is still open.
5. **Owner sign-off.** New entries, rank changes and removals are proposed in the worksheet and applied
   only with the owner's OK. Closures are applied immediately.

Urgent exceptions (a closure, a hazard, a road or trail notice) do not wait for the cycle: apply the
single result and rebuild the same day.

## Adding owner research

Drop the document next to `places.json`, add a source key under `meta.sources`, and enter each place
with `source.ref` pointing at it. Rankings go in `rank` / `areaRank` with `rankScope` naming the list
they belong to (`dining-overall`, `activities-overall`, …). Ratings and counts always carry an `asOf` date.

## Automation

A monthly Routine wakes the build session on the 1st, runs the worksheet, checks each due entry with
web search against the source hierarchy above, applies only what it could confirm, rebuilds and
republishes, and leaves a summary of open items for the owner. It never invents a fact, never deletes
an entry, and never adds a new recommendation without owner approval.
