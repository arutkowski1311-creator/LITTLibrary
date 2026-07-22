# Baseball Multi-Camera Stream Tracker

A design + Phase-0 prototype for watching a college/showcase game from 2–4
camera angles and tagging pitches and batted balls (e.g. *"hard ball to right
field"*), saved by team → player → game.

## Files
- **[`DESIGN.md`](./DESIGN.md)** — architecture, data model, camera-sync
  strategy, tech stack, and the phased build plan. Start here.
- **[`schema.sql`](./schema.sql)** — the relational data model (SQLite/Postgres).
- **[`prototype.html`](./prototype.html)** — a self-contained, no-server clickable
  prototype. Proves the **tag → store → query** loop.

## Try the prototype
Open `prototype.html` in a browser. No build, no server.
1. Add a couple players under **Game & roster**.
2. Under **Cameras**, load a local clip (or paste an MP4/HLS URL) into 1–4 panels;
   **Play all** drives every angle from one scrub bar. Adjust each angle's
   sync **offset** so a clap/flash lines up.
3. Pick a batter, choose the pitch result **in play**, click a **spray zone**,
   a **hardness** (keys `1`–`4`), a **launch** type — then **Save** (Enter).
4. Use the **hardness / zone** filters to query, e.g. all `hard` hits to `RF`.
   **Export JSON** to save the game's tags.

The prototype stores everything in the browser (localStorage). The production
tool (DESIGN §6, Phase 1) keeps the identical tag schema but swaps local files
for live WebRTC ingest via MediaMTX and localStorage for Postgres.

> Note: browsers can't play raw RTSP/RTMP. In production those feeds are
> re-published as WebRTC/HLS by a media server — the prototype uses local files
> and plain URLs so you can exercise the workflow today without that plumbing.
