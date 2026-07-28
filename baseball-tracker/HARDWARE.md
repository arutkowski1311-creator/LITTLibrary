# The Broadcast Kit — hardware (RAW Co. Streaming module, Phase 5)

Two kits, **one pipeline**. Everything downstream (Cloudflare Stream → the app →
scorekeeper → clips → RAW Score) is identical; only the capture rig changes.
Order early — the build plan flags camera lead time and ships Streaming mid.
The kit is also a **sellable product** ("Broadcast Kit as a product").

Buy against this **spec checklist**, not a specific model number (models/prices
move; the specs don't):

## The specs that matter (both kits)
- **1080p60** minimum — 60 fps is non-negotiable for baseball. At 30 fps a pitch
  and the contact frame smear. This matters more than 4K.
- **Fast/manual shutter + WDR** — games run into dusk and under lights; avoids
  motion blur and blown-out sun/shade.
- **H.264/H.265 with RTMP or SRT out** — that's what pushes to a Cloudflare Live
  Input. (PoE cams give RTSP on the LAN; a small box restreams to Cloudflare.)
- **Audio** optional for scoring, nice for broadcast.

## Permanent kit (home field)
- **2–4 PoE cameras**, fixed mounts: high behind the plate, center field, plus a
  1B or 3B angle. Outdoor-rated: **IP66/IP67**, wide temp range with a **built-in
  heater/blower** (NJ winters), UV/vandal housing.
- **PoE switch** + a small **always-on mini-PC/NVR** that pulls the RTSP feeds and
  pushes each to a Cloudflare Live Input (RTMP/SRT).
- **Wired internet drop** if the field has one; **NTP on the LAN** so feeds share
  a clock → auto timecode-align (the "synced by default" case).
- If cameras support **PTP/genlock** (wired-only), you get frame-accurate sync —
  check the spec sheet; otherwise NTP + align is plenty.

## Portable kit (away / showcase)
- **2 cameras** is the realistic count on the road (a center/wide + a plate
  angle) — setup time and power are the enemy, not image quality.
- Cameras on tripods → a **portable encoder** (or laptop) → **bonded-cellular
  hotspot** → the same Cloudflare Live Inputs.
- **Portable power station** for a few hours. Lean on the **manual sync offset**
  (a clap/flash at first pitch) since clean shared NTP won't be there.

## The real constraint: uplink (portable)
Four 1080p60 feeds is a lot of upstream; **cellular is unreliable at that rate.**
Two outs:
1. **Fewer angles + lower bitrate** on the road (2 feeds).
2. **Record locally, upload after** for away games — lose the *live* scoreboard
   there, keep every angle for post-game scoring/clips. (App handles review-mode
   scoring.)
Decide per game: home = full live multi-cam; away = light rig, live if uplink
allows, record-and-review if not.

## Wiring to the platform
- Each camera = one **Cloudflare Live Input** (`game_cameras.cf_live_input_id` /
  `cf_playback_id` in `streaming-module.sql`). Home games point at the permanent
  inputs; away games create temporary inputs for the portable rig.
- Playback in the app is HLS/WebRTC from Cloudflare; the multi-cam viewer applies
  **timecode-align + `sync_offset_ms`** per camera (`DESIGN.md` §4).
- The same broadcast drives **free vs premium tiers** (`game_broadcasts`) and can
  carry ad/subscription revenue via the streaming fundraiser.

## Buy-early checklist (safe to start during Phases 0–4)
- [ ] Confirm each home field's **power + internet** (or plan cellular).
- [ ] Pick a PoE camera meeting **1080p60 / WDR / IP66-67 / heater / RTMP|SRT**.
- [ ] 1 restreamer box + PoE switch per permanent field.
- [ ] Portable: 2 cameras, tripods, encoder, bonded-cellular, power station.
- [ ] Check camera spec for **PTP/genlock** (nice-to-have, frame-accurate sync).
- [ ] One Cloudflare Stream account; create Live Inputs per camera.
