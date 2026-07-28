# RAW Co. — Streaming / Live-Capture Module Spec

Where the camera + deep-stat work lives in the RAW Co. platform: it is the
**Streaming module** (the capture/broadcast side), built as a clean module on the
shared core, following every non-negotiable in `CLAUDE.md`.

> This supersedes the generic `schema.sql` / `INTEGRATION.md` in this folder for
> the *real* backend. Those were vendor-neutral sketches written before I saw the
> RAW Co. brief. The aligned schema is `streaming-module.sql`.

## How it fits the architecture

- **Shared core, not a silo.** The module reads/writes core tables (`orgs`,
  `teams`, `players`, `memberships`, `follows`, `consents`, `raw_measurements`)
  through the same interface every module uses. It defines only its own tables
  (`games`, `game_cameras`, `at_bats`, `pitches`, `batted_balls`, `clips`).
- **Multi-tenant from day one.** Every module table carries `org_id`; `team_id`
  is a reporting dimension, not a wall; every table gets an RLS policy in the same
  migration. Org A can never read Org B's games, scorecard, or clips.
- **Stack fit:** Supabase Postgres + **Realtime** (the scoreboard/box-score/parent
  feed subscribe to `games`/`pitches`/`batted_balls` — no hand-rolled sockets),
  **Cloudflare Stream** for the live inputs + clip cutting, Netlify for hosting.
  The existing `store` / `usePersist` seam in the React monolith is where this
  plugs in without rewriting screens.

## The three non-negotiables this module touches

1. **Minors' video = consent + scoped access.** `clips` is the most sensitive
   table in the module — it's video of children. Visibility is RLS-gated on the
   `consents` ledger (`media_use` / `streaming`) plus account-scoped `follows`
   plus scout approval (`scout_release` consent **and** an org approval row).
   Scout access opens only with **parent AND org** approval — never a path for an
   adult to reach a minor outside org oversight. Clip URLs are **signed**,
   server-minted; an unsigned playback URL for a minor's clip is never exposed.
2. **RAW Score is the moat → store raw first.** The scorecard *is* the raw data.
   A server-side, versioned job derives per-game measurements (`hard_hit_rate`,
   contact quality, situational production) into the existing `raw_measurements`
   table with `source='game'`. The score is computed **server-side** from those;
   formulas/weights never ship to the client. Uncaptured values are **null,
   never 0.** Contact quality is the scorer's call today; the identical input path
   accepts objective CV metrics later without changing the RAW Score plumbing.
3. **Org isolation via RLS, in the DB.** Not hidden in the UI — enforced by
   policy on every table, same mechanism as the rest of the platform.

## What each RAW Co. role gets (all from one captured event)

The camera layer aligns video to the scorecard's master clock, so each tagged
event auto-cuts a clip per angle. That one asset then serves every role through
the access scoping above:

- **Coach** — scores live while watching 2–4 synced angles (the one net-new
  surface); situational splits + per-pitcher/batter breakdown.
- **Player** — at-bats and outings become stat **+ film**; RAW Score inputs backed
  by video; an auto-built recruiting reel.
- **Parent / follower** — the live feed gains video moments of *their* player,
  within their granted `follows.scope` and consent.
- **Scout** — verified **data + film together**, but only for players with
  `scout_release` consent + org approval. The differentiator for the college
  portal, built inside the compliance rails.
- **Org** — permanent field cameras as shared infrastructure; the broadcast also
  feeds the **streaming revenue** campaign (`campaigns.type='streaming'`,
  `contributions.source_tag='streaming'`) already in the Fundraising Engine —
  ad slots / subscriptions on the same stream.

## Build order (module-at-a-time, keep it working)

The core spine (tenancy, auth/RLS, payments) comes first per `CLAUDE.md` — this
module assumes it. Then:

1. **Games + cameras + scorecard tables** with RLS. Port the existing prototype
   scorekeeper to write here through `store`/`usePersist`.
2. **Multi-cam viewer** in the Coach scorekeeper — Cloudflare Stream players, one
   clock, auto timecode-align + manual offset. (Drop-in module; ref
   `prototype.html`, `DESIGN.md` §4.) The one genuinely missing surface.
3. **Realtime scoreboard / box score / parent feed** via Supabase Realtime.
4. **Clip service** — server-side Cloudflare clip cut per event → `clips` with
   signed URLs, filed to player/situation, consent-gated.
5. **RAW Score derivation job** → `raw_measurements` (server-side, versioned,
   null-safe).
6. **Situational splits + narrative** views feeding player profiles, the RAW
   Report, and the scout portal.
7. **CV automation (later)** → objective contact metrics into the same event log,
   same clips, same RAW Score path.

## Reference artifacts in this folder

- `streaming-module.sql` — the aligned, RLS + consent schema (start here).
- `DATA-MODEL.md` — the event-sourcing rationale (vendor-neutral but accurate).
- `prototype.html` — reference implementation of the scorekeeper + synced viewer
  + live-derived box score (localStorage stand-in for Supabase).
- `NJRAW-INTEGRATION-BLUEPRINT.md` — the role-by-role integration narrative.
- `DESIGN.md` §4 — camera sync (timecode-align + manual offset), which the
  permanent PoE and portable kits both rely on.
