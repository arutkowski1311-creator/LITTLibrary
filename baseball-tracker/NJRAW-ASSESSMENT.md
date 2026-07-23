# NJ Raw Baseball — assessment & what to actually build next

I ran your uploaded app (`index.html`) headlessly and inspected it. Key
correction to my earlier from-scratch design: **most of the tracker I was
proposing already exists in your app.** Here's the honest map.

## What your app already does (Coach → Live scorekeeper)

Your scorekeeper already implements the **event-sourced "one scorecard drives
everything"** model — the app literally says so on the screen: *"One scorecard
drives everything — the pitcher panel, batter history, parents' live feed, and
the post-game box score & recap."* That is exactly the architecture from
`DATA-MODEL.md`, already built.

Confirmed present:
- **Per-pitch scoring** — Ball / Strike / Foul / HBP / Wild pitch / Steal /
  Undo, with live **count, outs, bases** ("Edit bases"), runs in.
- **Batted-ball capture** on "Ball in play →" — the data model carries
  `direction` (heavily used), `field`, batted-ball type, `launch`, `result`,
  `rbi`, `runners` — i.e. "line drive to center / blooper to LF / etc."
- **Hard-hit + hard-hit-OUT** tags — the "rocket the RF caught" case is already
  a first-class concept.
- **Live pitcher panel** (derived): pitches, K, BB/HBP, hits, runs, hard-hit,
  1st-pitch-K %, strike %.
- **Batter history** (derived): "Today 0-for-0", "Last 3 at-bats", box score,
  recap, parent live feed.
- **Roster/team model** and per-player persistence (`njraw:` localStorage).

So "track hits/pitches, identify a hard ball to right, save by team/player" —
**already there.**

## A design decision your app already made (and it's the right one)

On the scorekeeper: *"Contact quality is your call as you score. Rapsodo velo &
exit-velo come from practice, not live games."* You've already concluded that
**live exit velocity isn't captured from the cameras** — the scorer's judgment
supplies contact quality live, and objective Rapsodo numbers come from practice.
That matches the honest reality of CV (real exit-velo from broadcast angles is a
hard research problem). Good call.

## The real gaps vs. your stated vision

1. **Multi-camera synced video *inside* the scorekeeper.** The scorekeeper is
   currently a **tap-only scorecard — no video panel.** Your original ask was to
   *score while watching 2–4 synced angles.* That viewing surface (Cloudflare
   Stream feeds in a 2–4-up grid with one clock, next to the tap buttons) is the
   biggest missing piece. Design for it: `DESIGN.md` §4 (sync) + `prototype.html`
   (the synced grid).

2. **Situational splits & the auto-narrative.** Capture binds base/out/count to
   each ball, but the *surfaced* deep line — "3-for-4, 2 scorched liners to CF
   with 2 on, a blooper beyond SS with nobody on, a rocket the RF caught bases
   loaded, 2 out" — needs the **split views and a narrative generator** on top of
   data you're already collecting. `schema.sql` example queries + `DATA-MODEL.md`
   "stats you get for free" are the spec.

3. **Real persistence / backend.** It's a **prototype on mock data**
   (`Build fd7ccd`, `localStorage`). Accumulating deep stats across a season for
   every player/pitcher needs the Stage-2 backend in `INTEGRATION.md`.

## The integration reality (important)

Your `index.html` is a **minified production bundle** (~600 KB, one line of
compiled React). It should **not** be hand-patched — the source lives in the
Claude chat/project that generated it. So the right workflow is:

- Treat this repo's `DATA-MODEL.md` / `schema.sql` / `prototype.html` as the
  **spec + reference implementation** for the additions.
- Make the actual changes **in the source project** (the Claude chat), where the
  scorekeeper component can gain a video grid and the splits views.
- Where a piece is self-contained (e.g. the multi-cam synced viewer, or a
  situational-splits panel), I can build it as a **standalone, framework-agnostic
  module** you drop into that project.

## Recommended next step (pick one)

- **A. Multi-cam synced viewer module** — a self-contained component: 2–4
  Cloudflare Stream players, one scrub/clock, per-camera sync offset, that sits
  next to your existing tap buttons. Highest-value gap.
- **B. Situational-splits + narrative view** — turn the data you already capture
  into the deep per-player/per-pitcher lines and the plain-English recap.
- **C. Persistence/backend spec** — the events API + DB so stats live across
  games.
