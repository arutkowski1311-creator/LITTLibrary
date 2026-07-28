# NJ Raw × Live Cameras — Integration Blueprint

How the multi-camera + deep-stat work folds into the existing NJ Raw platform
(Parent / Player / Coach / Org / Scout, the RAW Score, the RAW Report, the
Video Library, and the college-coach portal) — not as a bolt-on, but as the
layer that ties them together.

## The core idea: one timeline, and clips are the connective tissue

NJ Raw already has two of the three pieces:
- **The scorecard** — the event-sourced Live Scorekeeper ("one scorecard drives
  everything"): every pitch and batted ball, with count/outs/bases, direction,
  hard-hit, results.
- **The output surfaces** — RAW Score, the 14-page RAW Report, recruiting
  profiles, the parents' live feed, the scout portal, the Video Library.

The **cameras are the missing middle**. They add two things:
1. A **video timeline** aligned to the scorecard's master clock, so a scorer can
   tag *while watching* 2–4 angles.
2. Because every tagged event has a timestamp, the system can **auto-cut a short
   clip from each angle** at that moment.

That clip is the connective tissue. A single tagged event —
*"scorched liner to CF, 2 on, RBI double"* — becomes **one asset** that is
simultaneously: a stat line, a verified video, a RAW Report exhibit, a
recruiting highlight, and a parent-feed moment. **You capture it once; every
role consumes the same object.**

```
   Permanent PoE rig ─┐                       ┌─▶ Coach: score live on 2–4 synced angles
   Portable field rig ┼─▶ Cloudflare Stream ──┤     + situational splits
                      │      (live inputs)     │
                      │                        └─▶ every tagged event ──┐
                      ▼                                                  │ auto-clip
              ┌──────────────── the game timeline (master clock) ───────┴───────┐
              │  scorecard events  ⇄  aligned video from each angle             │
              └───────────────────────────┬────────────────────────────────────┘
                                           │ one asset per event (stat + clip)
     ┌───────────────┬───────────────┬─────┴────────┬──────────────┬────────────┐
   ▼ Player        ▼ Parent        ▼ Scout /       ▼ RAW Report   ▼ Video      ▼ RAW
   RAW Score,      live feed,      College portal  (14-page,      Library      Score
   at-bat film,    their kid's     verified data   auto-populated  (auto-filed  inputs
   recruiting reel clips           + film          exhibits)       clips)
```

## What each role gets (all from the same captured event)

- **Coach** — scores the game *while watching* the synced angles (the one net-new
  input surface); gets situational splits (hard-hit% w/ RISP, hard-hit outs,
  spray/depth tendencies) and a per-pitcher/per-batter breakdown.
- **Player** — every at-bat and outing is now **stat + film**: RAW Score inputs
  backed by video, an auto-built recruiting reel of hard-hit balls and outings.
- **Parent** — the live feed gains **video moments** of their kid's at-bats, not
  just text; post-game, their clips are already filed.
- **Scout / College coach portal** — the differentiator: **verified data +
  verified film** together. "3-for-4 with 2 scorched liners" is clickable to the
  actual video from multiple angles — trust without a re-upload.
- **Org** — the permanent field cameras are shared infrastructure: security-grade
  uptime doubling as the capture layer; away games use the portable kit.

## Feeding the outputs NJ Raw already has

- **RAW Score** — today contact quality is the scorer's call. The camera layer
  keeps that but **attaches the evidence clip** to each judgment, and (later,
  Phase-4 CV) can supply objective contact metrics. The score gets more
  defensible without changing its structure.
- **RAW Report (14-page)** — its exhibits (at-bats, contact quality, situational
  performance) **auto-populate** from the event log + clips instead of being
  assembled by hand. The report becomes a view over live data.
- **Video Library** — "Clip saved to the Video Library" already exists; now clips
  are **auto-filed per event**, tagged by player, pitcher, situation, and result,
  so they're queryable ("show me his hard-hit balls to right with RISP").

## The minimal app deltas (what to actually add)

Everything else already exists. The additions are:
1. **Multi-cam viewer** inside the Coach scorekeeper — 2–4 Cloudflare Stream
   players, one clock, auto timecode-align + manual offset. (The one net-new
   surface. Build as a drop-in module; see `prototype.html`, `DESIGN.md` §4.)
2. **Clip service** — on each tagged event, cut a short window from each angle
   and file it as an asset linked to the event/player/pitcher.
3. **Situational-splits + narrative views** — surface the deep per-player/pitcher
   lines from data already captured (`schema.sql` example queries).
4. **Asset model** — a `clip` record: `{event_id, player_id, pitcher_id, camera,
   url, start_ms, end_ms, situation}` linking video to the event log.

## Build order (ties hardware + app together)

1. **Prove the loop, portable, 2 cameras** → Cloudflare inputs → multi-cam viewer
   beside the existing scorekeeper. Score one real game end-to-end.
2. **Add the clip service** → every tagged event auto-produces clips; wire them
   into the Video Library + player profiles.
3. **Situational splits + narrative** → the deep stat lines feed RAW Score / RAW
   Report / scout portal.
4. **Permanent home-field rig** → replicate the proven portable setup as fixed
   PoE (spec + wiring: forthcoming `HARDWARE.md`).
5. **Backend/persistence** → season-long accumulation across games (`INTEGRATION.md`
   Stage 2).
6. **CV automation (later)** → objective contact metrics into the same event log
   and the same clips.

## Integration reality (unchanged)

The shipped `index.html` is a **minified bundle** — these changes belong in the
**source project** that generated it. This repo's docs + `prototype.html` are the
spec and reference; self-contained pieces (viewer, splits view) I can hand you as
drop-in modules.
