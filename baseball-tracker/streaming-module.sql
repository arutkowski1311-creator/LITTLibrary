-- RAW Co. Platform — STREAMING / LIVE-CAPTURE module schema SKETCH
-- (starting point in the style of schema-sketch.sql — refine, do not treat as locked)
--
-- This is the capture side of the "Streaming" module: multi-camera live feeds + the
-- event-sourced scorecard + auto-clips. It plugs into the shared core (orgs, teams,
-- players, memberships, follows, consents, raw_measurements) — it does NOT redefine them.
--
-- NON-NEGOTIABLES honored here:
--   * EVERY table carries org_id and gets an RLS policy in THIS migration. Isolation is
--     org-to-org, enforced in the DB. team_id is a reporting DIMENSION, never a wall.
--   * Video of players is MINORS' data. Clip visibility is gated on the consents ledger
--     (covers in 'media_use'/'streaming') + account-scoped follows + scout approval —
--     not just hidden in the UI.
--   * The scorecard is the RAW DATA. RAW Score is computed SERVER-SIDE from it later;
--     we store measurements, never a client-computed score, and never zero-fill (null).
--
-- Assumes helper functions the core migration builds (see schema-sketch TODO):
--   is_org_member(org), is_org_staff(org)  [coach|org_admin|league_admin],
--   follows_team(team), follows_player(player), is_family_member(family),
-- plus two this module needs:
--   has_active_consent(player, covers text)  -- a consents row, revoked_at is null
--   scout_can_see(player)                    -- scout_release consent AND an org approval row

-- ─────────────────────────────────────────────────────────────────────────────
-- GAMES + CAMERAS
-- ─────────────────────────────────────────────────────────────────────────────

create table games (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id),
  team_id       uuid references teams(id),          -- reporting dimension (which of our teams)
  opponent_name text,
  venue         text,
  is_home       boolean,                            -- home field (permanent rig) vs away (portable)
  starts_at     timestamptz,
  status        text not null default 'scheduled',  -- scheduled|live|final
  -- master clock: unix-ms that scrub position 0 maps to, so every event/clip aligns to video
  clock_origin_ms bigint,
  created_at    timestamptz not null default now()
);

create table game_cameras (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references orgs(id),
  game_id        uuid not null references games(id),
  label          text not null,                     -- 'CF','high home','1B','3B'
  cf_live_input_id text,                            -- Cloudflare Stream Live Input id
  cf_playback_id text,                              -- Cloudflare playback id (HLS/DASH/WebRTC)
  sync_offset_ms int not null default 0,            -- manual trim on top of timecode-align
  is_permanent   boolean not null default false,    -- fixed PoE rig vs portable kit
  created_at     timestamptz not null default now()
);

-- BROADCAST + VIEWER TIERS (Phase 5: "free vs premium viewer tiers").
-- Premium access is a paid entitlement that ties to the Fundraising Engine's streaming
-- revenue (campaigns.type='streaming', contributions.source_tag='streaming').
create table game_broadcasts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id),
  game_id       uuid not null references games(id),
  is_live       boolean not null default false,
  free_tier     text default 'scoreboard',  -- what a free viewer gets: scoreboard | delayed | none
  premium_tier  text default 'multicam',     -- what premium gets: multicam | clips | full
  created_at    timestamptz not null default now()
);
-- Access helper the app calls: has_stream_access(game, 'premium') — true for org staff,
-- the player's family, or an account with an active streaming subscription for this org.

-- ─────────────────────────────────────────────────────────────────────────────
-- THE SCORECARD  (event-sourced: at_bat → pitch → batted_ball; state stamped on each)
-- PORT MAP — this is the existing prototype's LiveGame data, normalized:
--   game:st  {inn,half,outs,balls,strikes,bi,us,them,pc}  → games + pitches.state cols
--   game:ev  {k:'pitch',res,first}                        → pitches (res→result)
--   game:ev  {k:'pa',bi,txt,r,z,q,out,tk,sw}              → at_bats + batted_balls, where
--     bi (lineup slot) → players.id via lineup;  r → result;  q(soft|med|hard) → hardness
--     z (cf|rcf|rfl|3b|ss|…) → SPLIT into spray_zone + fielder + depth;
--     launch (fly|line|ground|pop) is today only in txt → PULL OUT into batted_balls.launch.
--   Enhancements the port adds: structured launch, split z, optional 'scorched' 4th tier,
--   exit_velo_est (null now, CV later), and per-player linkage (bi → players.id).
-- Opposing players aren't in our players table, so player refs are nullable + a name text.
-- RAW Score measurements are only ever written for OUR players (a real players.id).
-- ─────────────────────────────────────────────────────────────────────────────

create table at_bats (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references orgs(id),
  game_id          uuid not null references games(id),
  team_id          uuid references teams(id),
  batter_player_id uuid references players(id),     -- set when the batter is OUR player
  batter_name      text,                            -- else opponent name
  pitcher_player_id uuid references players(id),     -- set when the pitcher is OUR player
  pitcher_name     text,
  inning           int,
  half             text,                            -- 'top'|'bottom'
  result           text,                            -- single|strikeout|walk|out|...
  created_at       timestamptz not null default now()
);

create table pitches (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id),
  game_id       uuid not null references games(id),
  at_bat_id     uuid not null references at_bats(id),
  seq           int,
  pitch_type    text,                               -- FB|CB|SL|CH|CT|SP
  velo_mph      numeric,                            -- null if not captured (never 0)
  location_zone text,                               -- '1'..'9' + 'chase'
  result        text,                               -- ball|called|swinging|foul|in_play|hbp|wild
  -- GAME STATE stamped on the pitch → every situational split is a GROUP BY over this
  outs_before   int, balls int, strikes int,
  on_1b         boolean default false, on_2b boolean default false, on_3b boolean default false,
  score_us      int, score_them int,
  game_ms       bigint,                             -- position on the master clock
  created_at    timestamptz not null default now()
);

create table batted_balls (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id),
  game_id       uuid not null references games(id),
  pitch_id      uuid not null references pitches(id),
  batter_player_id uuid references players(id),
  -- contact detail captured on EVERY ball in play, including outs (the "hard-hit out" case)
  hardness      text,                               -- soft|medium|hard|scorched (scorer's call)
  launch        text,                               -- ground|line|fly|popup|blooper
  spray_zone    text,                               -- LF|LCF|CF|RCF|RF|IF_pull|IF_mid|IF_oppo
  depth         text,                               -- infield|shallow|medium|deep|wall
  fielder       text,                               -- position that fielded it
  caught        boolean default false,              -- caught on the fly → hard-hit OUT signal
  exit_velo_est numeric,                            -- null now; objective velo from CV later
  result        text,                               -- single|double|triple|hr|flyout|groundout|lineout|error
  rbi           int default 0,
  runs_scored   int default 0,
  game_ms       bigint,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- CLIPS  (auto-cut per tagged event; the connective tissue to every role)
-- MOST SENSITIVE TABLE in the module: it is video of minors. RLS below is strict.
-- ─────────────────────────────────────────────────────────────────────────────

create table clips (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id),
  game_id       uuid not null references games(id),
  team_id       uuid references teams(id),
  player_id     uuid references players(id),        -- the featured player (a minor)
  camera_id     uuid references game_cameras(id),
  -- what event this clip is of, for query ("his hard-hit balls to RF with RISP")
  event_kind    text,                               -- 'pitch'|'batted_ball'
  pitch_id      uuid references pitches(id),
  batted_ball_id uuid references batted_balls(id),
  cf_clip_url   text,                               -- Cloudflare Stream clip / signed URL
  start_ms      bigint, end_ms bigint,
  situation     jsonb,                              -- {outs,count,runners,score} snapshot
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- FEEDING THE RAW SCORE  (store RAW DATA FIRST — write to the core raw_measurements)
-- ─────────────────────────────────────────────────────────────────────────────
-- Do NOT compute a score here. A server-side job (or trigger) derives per-game measurements
-- from batted_balls/pitches into the existing core table, e.g.:
--   INSERT INTO raw_measurements (org_id, player_id, domain, measure_key, value, captured_at, source, model_version)
--   SELECT bb.org_id, bb.batter_player_id, 'Game Production', 'hard_hit_rate',
--          avg((bb.hardness in ('hard','scorched'))::int), g.starts_at, 'game', :model_version
--   FROM batted_balls bb JOIN games g ON g.id = bb.game_id
--   WHERE bb.batter_player_id is not null GROUP BY bb.org_id, bb.batter_player_id, g.starts_at;
-- Contact quality is the scorer's call today (like the app already says); the SAME pipeline
-- accepts objective exit_velo_est from CV later — the RAW Score input path never changes.
-- value is left NULL when uncaptured, never 0.

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY  (enable on EVERY table above, in THIS migration)
-- ─────────────────────────────────────────────────────────────────────────────

alter table games         enable row level security;
alter table game_cameras  enable row level security;
alter table game_broadcasts enable row level security;
alter table at_bats       enable row level security;
alter table pitches       enable row level security;
alter table batted_balls  enable row level security;
alter table clips         enable row level security;

-- Game/scorecard data: org staff read+write; parents/players/followers READ within scope.
-- (Repeat this shape per table; games shown, then the child tables inherit via game_id join.)
create policy games_staff_rw on games
  using (is_org_staff(org_id)) with check (is_org_staff(org_id));
create policy games_follower_read on games for select
  using (
    is_org_member(org_id)                                   -- any member of the org, refined by:
    and ( is_org_staff(org_id)
       or follows_team(team_id)
       or exists (select 1 from at_bats ab where ab.game_id = games.id
                  and follows_player(ab.batter_player_id)) )
  );

-- Scorecard children: readable if the parent game is readable; writable by org staff.
create policy pitches_staff_rw on pitches
  using (is_org_staff(org_id)) with check (is_org_staff(org_id));
create policy pitches_scoped_read on pitches for select
  using (exists (select 1 from games g where g.id = pitches.game_id));  -- games RLS does the gating

-- CLIPS — the strict one. A clip of a minor is visible ONLY to:
--   * org staff (coach/admin) for that org, OR
--   * the player's own family, OR
--   * a follower of that player/team whose follow grants 'clips' AND the player has an
--     active media/streaming consent, OR
--   * a scout for whom scout_can_see(player) is true (scout_release consent + org approval).
create policy clips_scoped_read on clips for select
  using (
    is_org_staff(org_id)
    or exists (select 1 from players p where p.id = clips.player_id and is_family_member(p.family_id))
    or ( (follows_player(clips.player_id) or follows_team(clips.team_id))
         and has_active_consent(clips.player_id, 'media_use') )
    or scout_can_see(clips.player_id)
  );
create policy clips_staff_write on clips for all
  using (is_org_staff(org_id)) with check (is_org_staff(org_id));

-- Broadcast row: staff manage it; any org member may read whether a game is live, but the
-- actual premium video access is gated by has_stream_access() at the player/URL layer.
create policy broadcasts_staff_rw on game_broadcasts
  using (is_org_staff(org_id)) with check (is_org_staff(org_id));
create policy broadcasts_member_read on game_broadcasts for select
  using (is_org_member(org_id));

-- TODO for the implementing session:
--   1. Repeat the staff_rw + scoped_read policy pair on at_bats, batted_balls, game_cameras.
--   2. Build has_active_consent(player, covers) and scout_can_see(player) helpers.
--   3. The RAW Score derivation job → raw_measurements (server-side, versioned, null-safe).
--   4. Supabase Realtime: publish games/pitches/batted_balls so the scoreboard + parent
--      live feed update without polling (replaces any hand-rolled WebSocket).
--   5. Clip creation runs server-side against Cloudflare Stream (clip API), writing signed
--      URLs — never expose an unsigned playback URL for a minor's clip.
