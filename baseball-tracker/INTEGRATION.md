# Integration — single self-contained web app

**Confirmed setup:** the streaming app was built in Claude chat (a self-contained
HTML artifact), and scoring happens **in-app**, in a panel next to the live
video. That collapses the architecture nicely.

## Stage 1 — one page, no server (do this first)

Everything lives in the same web page you already have:

```
┌──────────────────────── your web app (one HTML page) ─────────────────────┐
│  ┌── live camera grid (your PoE streams) ──┐   ┌── in-app scorer panel ──┐ │
│  │  2–4 synced angles, one scrub bar        │   │ situation + pitch + hit │ │
│  └──────────────────────────────────────────┘   └──────────┬──────────────┘ │
│                                                             │ appends event   │
│  ┌── live box score / scoreboard (derived) ──┐   ┌── event log (in memory) ─┐│
│  │  recomputes on every event                 │◀──│  + localStorage backup   ││
│  └────────────────────────────────────────────┘   └──────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

- The **event log** is a JS array; the scoreboard/box score are functions of it
  (exactly like `prototype.html`).
- **localStorage** persists across reloads; **Export JSON** saves a game.
- This is a complete, usable tool for one scorer on one device — no infra.

## Stage 2 — add a backend when you need it

Move to a small backend the moment you want any of:
- Stats that persist and accumulate **across games/season** in a real DB.
- **Multiple viewers** seeing the same live scoreboard (fans, dugout, press box).
- The scorer on one device, the scoreboard on another.

Minimal shape (unchanged event schema):
- `POST /events` — append an event.
- `GET /state/:gameId` + **WebSocket** — push scoreboard/box-score updates.
- Postgres holds the event log + materialized player/pitcher splits.

The page's projection functions barely change — they just read from a pushed
feed instead of the local array. Same event shape end to end.

## PoE cameras → browser (the one real constraint)

Browsers can't play raw RTSP/RTMP off a PoE cam. Whatever your current app does
to show the streams already solves this (likely an HLS/WebRTC URL from an NVR or
a small restreamer). The scorer panel just overlays that same video grid — it
doesn't touch how the frames arrive. If you later want the tightest sync for
tagging, put a **MediaMTX** restreamer in front (RTSP in → WebRTC out).

## Next build step

Merge three things into your existing page:
1. the **in-app scorer panel** (situation + pitch + batted-ball detail),
2. the **event log + localStorage**,
3. the **live-derived box score**.

`prototype.html` already contains working versions of all three — the merge is
dropping them alongside your camera grid and pointing the scorer at your roster.
