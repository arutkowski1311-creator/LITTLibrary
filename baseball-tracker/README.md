# Baseball Multi-Camera Stream Tracker

A design + Phase-0 prototype for watching a college/showcase game from 2–4
camera angles and tagging pitches and batted balls (e.g. *"hard ball to right
field"*), saved by team → player → game.

## Files
- **[`DESIGN.md`](./DESIGN.md)** — architecture, camera-sync strategy, tech
  stack, and the phased build plan. Start here.
- **[`DATA-MODEL.md`](./DATA-MODEL.md)** — the situational stat engine: event
  sourcing, deep contact detail, the scoreboard/box-score/stat-DB projections,
  and how it feeds your existing camera app behind the scenes.
- **[`schema.sql`](./schema.sql)** — the relational data model (SQLite/Postgres),
  with game state stamped on every event and example situational queries.
- **[`example-atbat.json`](./example-atbat.json)** — your exact "3-for-4 with 2
  scorched liners… a rocket the RF caught" scenario, fully decomposed, with the
  derived box line and splits.
- **[`prototype.html`](./prototype.html)** — a self-contained, no-server clickable
  prototype. Proves the **tag → store → derived box score → query** loop, now
  capturing base/out/count/score on every play.

## Try the prototype
Open `prototype.html` in a browser. No build, no server.
1. Add a couple players under **Game & roster**.
2. Under **Cameras**, load a local clip (or paste an MP4/HLS URL) into 1–4 panels;
   **Play all** drives every angle from one scrub bar. Adjust each angle's
   sync **offset** so a clap/flash lines up.
3. Set the **situation** (outs, count, who's on base, score) — it stamps onto
   every event and drives the splits.
4. Pick a batter, choose the pitch result **in play**, click a **spray zone**,
   a **hardness** (keys `1`–`4`), **launch**, **depth**, **fielder**, and
   **caught** (a caught scorched ball = a hard-hit out) — then **Save** (Enter).
5. Watch the **Box score (derived live)** update — AB/H/RBI plus **Hard%** and
   **hard-hit outs**, all computed from the play log, nothing entered by hand.
6. Use the **hardness / zone** filters to query, e.g. all `hard` hits to `RF`.
   **Export JSON** to save the game's tags.

The prototype stores everything in the browser (localStorage). The production
tool (DESIGN §6, Phase 1) keeps the identical tag schema but swaps local files
for live WebRTC ingest via MediaMTX and localStorage for Postgres.

> Note: browsers can't play raw RTSP/RTMP. In production those feeds are
> re-published as WebRTC/HLS by a media server — the prototype uses local files
> and plain URLs so you can exercise the workflow today without that plumbing.
