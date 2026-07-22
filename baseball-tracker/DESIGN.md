# Baseball Multi-Camera Stream Tracker — Design

**Goal:** Watch a live college/showcase game from 2–4 camera angles, tag what
happens (pitches, hits, etc.) as it happens, and save it in a structured way
keyed by **team → player → game → at-bat → pitch → batted ball**, so you can
later ask questions like *"show me every hard-hit ball to right field by
player X this season."*

**Chosen path (from the design questions):**
- Level: **College / showcase** — some venues have TrackMan/Rapsodo/Synergy data, many don't, so we can't rely on an external feed. We build our own.
- Detection: **Assisted tagging first** — a human one-clicks events during synced playback. This gives a usable tool in weeks *and* produces the labeled dataset needed to automate later.
- Source: **Live RTSP/RTMP** — real cameras/encoders pushing feeds we ingest in near-real-time.

---

## 1. The key insight

"Identify a hard ball hit to right field" is really **two independent labels**:

| Sub-label | Meaning | Later automated by |
|---|---|---|
| **Hardness** | soft / medium / hard / scorched (proxy for exit velocity) | ball tracking across frames → speed |
| **Spray direction** | which field zone: LF / LCF / CF / RCF / RF (+ infield) | pixel→field homography from a fixed camera |

In the assisted phase, a human supplies both with one click. The trick that
makes this whole plan pay off: **the human's tags use the exact same fields a
computer-vision model will eventually output.** So every game you tag by hand
is training data for the automation. You never throw the manual work away.

So `"hard hit to right"` is just a stored record:
`BattedBall { hardness: "hard", spray_zone: "RF" }` — and the query is trivial.

---

## 2. Architecture (layers)

```
 Cameras (2–4)          Media server            Browser app              Store
 RTSP/RTMP  ──push──▶   MediaMTX          ──▶   Synced 4-up grid   ──▶   Postgres
 (encoders)            (RTSP/RTMP in,           + keyboard tagging        (SQLite to start)
                        WebRTC/HLS out)         + spray diagram           + short clips
                             │                        │                     (ffmpeg cut)
                             └── records w/            └── every tag refs
                                 timestamps               the master clock
```

1. **Ingest.** Each camera pushes RTSP/RTMP into **MediaMTX** (free single
   binary). Browsers can't play RTSP directly, so MediaMTX re-publishes each
   feed as **WebRTC** (sub-second latency — needed so tagging tracks the live
   action) with an **HLS** fallback.
2. **Sync.** All angles must map to one **master game clock**. See §4 — this is
   the part most people underestimate.
3. **View.** A browser grid of 2–4 players sharing one scrub bar. Jump to any
   tagged event and all angles land on the same instant.
4. **Tag.** Keyboard-first capture panel with a fixed taxonomy (§3). A game is
   ~250–300 pitches, so speed of entry is the whole ballgame.
5. **Store.** Normalized relational model keyed by team/player/game (§3).
6. **Query / export.** Filter and roll up by team, player, zone, hardness, etc.
7. **Automate (later).** Swap human tags for CV outputs into the *same* schema.

---

## 3. Data model

Entities and the important fields. Full DDL is in [`schema.sql`](./schema.sql);
a runnable example lives in the [prototype](./prototype.html).

- **team** — name, level, season
- **player** — team_id, name, jersey, position, bats (L/R/S), throws (L/R)
- **game** — date, home_team, away_team, venue
- **camera** — game_id, label (`"CF"`, `"high home"`, `"1B dugout"`, `"3B"`),
  stream_url, **sync_offset_ms** (§4)
- **at_bat** — game_id, batter_id, pitcher_id, inning, half, result
- **pitch** — at_bat_id, seq, type (FB/CB/SL/CH/…), velo (nullable),
  location_zone (strike-zone 3×3 + chase), result (ball/called/swinging/foul/in_play)
- **batted_ball** — pitch_id, **hardness** (soft/medium/hard/scorched),
  **launch** (ground/line/fly/popup), **spray_zone** (LF/LCF/CF/RCF/RF/IF-pull/IF-mid/IF-oppo),
  pull_or_oppo, exit_velo_est (nullable), result (single/double/…/out/error)
- **event** — generic tag: game_timestamp_ms, kind, camera_refs[], created_by,
  notes. Every pitch/batted_ball links back to a master-clock timestamp so it's
  reviewable from any angle.

Because everything hangs off `team`/`player`/`game`, "save the data simply by
team, player" falls out for free — it's just foreign keys.

**Spray zones.** Outfield split into 5 wedges (LF, LCF, CF, RCF, RF); infield
split pull/up-middle/oppo. Ordinal **hardness** (soft→scorched) maps to exit-velo
buckets later (e.g. scorched ≈ 95+ mph) once you have TrackMan ground truth to
calibrate.

---

## 4. Camera sync (the part that bites people)

Multiple live cameras never start at the same instant and can drift. If angles
aren't aligned, a tag placed on one feed points at the wrong moment on another.
Options, cheapest to best:

1. **Manual offset (start here).** At first pitch, create one visible sync
   event in *all* frames — a camera flash or a clap board. In the app, nudge
   each camera's `sync_offset_ms` until that instant lines up. Store the offset;
   the UI applies it so one scrub bar drives every angle. Good enough for
   assisted tagging.
2. **Wall-clock timestamps.** Have encoders embed timecode / rely on RTP sender
   reports; MediaMTX records with timestamps and you compute offsets once.
3. **Hardware genlock/timecode.** Pro rigs, frame-accurate, expensive. Overkill
   for now.

The prototype implements #1 (per-camera offset slider) so you can feel the
problem immediately.

---

## 5. Tech stack

| Layer | Recommendation | Why |
|---|---|---|
| Media server | **MediaMTX** | RTSP/RTMP in → WebRTC/HLS out, one binary, free |
| Frontend | Web app (this repo's style: HTML/JS) | Grid of WebRTC players + keyboard tagging |
| Backend/API | FastAPI (Python) or Node | Thin; Python eases the future CV work |
| DB | **SQLite** now → **Postgres** later | Start frictionless, grow into it |
| Clip storage | server-side **ffmpeg** cut on each tag | Keep short event clips, not all raw footage |
| Future CV | YOLO (ball/player detect) + homography (pixel→field) + tracking (speed) | Trained on *your* Phase 1–2 labels; calibrate against TrackMan/Rapsodo where a venue has it |

---

## 6. Phased plan

- **Phase 0 — now (in this repo).** Data schema + a clickable single-file
  prototype that proves the **tag → store → query** loop with local video or an
  HLS URL. No servers required. *(Delivered: `prototype.html`, `schema.sql`.)*
- **Phase 1 — the real tool.** MediaMTX ingest, WebRTC 4-up grid, real DB,
  keyboard tagging, per-tag clip cutting, camera sync UI. This is genuinely
  usable at a game.
- **Phase 2 — analytics.** Query/report UI by team & player: spray charts,
  hardness distributions, pitch-type tendencies, season rollups, CSV/JSON export.
- **Phase 3 — feed ingestion (optional).** Where a venue has TrackMan/Rapsodo/
  Synergy, ingest it to auto-fill velocity and give ground truth.
- **Phase 4 — automation.** Train CV on the labels from Phases 1–3 to auto-fill
  hardness and spray, human confirms/corrects.

Each phase is independently useful — you never need Phase 4 before the tool
earns its keep.

---

## 7. Keyboard-first tagging (why it works)

A game is ~250–300 pitches; mousing every field is too slow. Design the capture
so one at-bat is a few keystrokes:

- `P` = new pitch → number keys = pitch type → `b`/`s`/`f` = ball/strike/foul.
- On contact, `I` = in play → a quick **spray diagram click** for direction +
  `1`–`4` for hardness (soft→scorched) + `g`/`l`/`f`/`p` for launch.
- Everything auto-stamps the master clock and links to the current batter.

The prototype wires up a first cut of this so you can test the ergonomics.
