-- Baseball Multi-Camera Stream Tracker — data model
-- SQLite dialect (portable to Postgres with minor type tweaks).
-- Everything hangs off team -> player -> game so data is naturally
-- organized "by team, by player."

PRAGMA foreign_keys = ON;

CREATE TABLE team (
    id       INTEGER PRIMARY KEY,
    name     TEXT NOT NULL,
    level    TEXT,                 -- 'college', 'showcase', ...
    season   TEXT,                 -- '2026'
    UNIQUE (name, season)
);

CREATE TABLE player (
    id        INTEGER PRIMARY KEY,
    team_id   INTEGER NOT NULL REFERENCES team(id),
    name      TEXT NOT NULL,
    jersey    TEXT,
    position  TEXT,                -- 'RF', 'SS', 'RHP', ...
    bats      TEXT,                -- 'L' | 'R' | 'S'
    throws    TEXT                 -- 'L' | 'R'
);

CREATE TABLE game (
    id          INTEGER PRIMARY KEY,
    played_on   TEXT NOT NULL,     -- ISO date
    home_team_id INTEGER REFERENCES team(id),
    away_team_id INTEGER REFERENCES team(id),
    venue       TEXT,
    -- master clock origin: unix ms of the moment scrub position 0 maps to
    clock_origin_ms INTEGER
);

CREATE TABLE camera (
    id            INTEGER PRIMARY KEY,
    game_id       INTEGER NOT NULL REFERENCES game(id),
    label         TEXT NOT NULL,   -- 'CF', 'high home', '1B dugout', '3B'
    stream_url    TEXT,            -- rtsp/rtmp source or webrtc/hls playback url
    sync_offset_ms INTEGER DEFAULT 0  -- added to master clock for this angle
);

CREATE TABLE at_bat (
    id          INTEGER PRIMARY KEY,
    game_id     INTEGER NOT NULL REFERENCES game(id),
    batter_id   INTEGER NOT NULL REFERENCES player(id),
    pitcher_id  INTEGER REFERENCES player(id),
    inning      INTEGER,
    half        TEXT,              -- 'top' | 'bottom'
    result      TEXT               -- 'single','strikeout','walk','out',...
);

-- Every pitch/batted_ball carries the FULL game state at that instant, so
-- every situational split (RISP, bases loaded, by count, by outs) is just a
-- GROUP BY over this data. The state is stamped on the event, never recomputed.
CREATE TABLE pitch (
    id             INTEGER PRIMARY KEY,
    at_bat_id      INTEGER NOT NULL REFERENCES at_bat(id),
    seq            INTEGER,        -- pitch # within the at-bat
    pitch_type     TEXT,           -- 'FB','CB','SL','CH','CT','SP'
    velo_mph       REAL,           -- nullable; filled if known/estimated
    location_zone  TEXT,           -- '1'..'9' strike zone + 'chase'
    result         TEXT,           -- 'ball','called','swinging','foul','in_play'
    -- game state AT THE PITCH (context that powers pitcher + batter splits):
    outs_before    INTEGER,        -- 0,1,2
    balls          INTEGER,
    strikes        INTEGER,
    on_1b          INTEGER DEFAULT 0,  -- 0/1 occupied
    on_2b          INTEGER DEFAULT 0,
    on_3b          INTEGER DEFAULT 0,
    score_bat      INTEGER,        -- batting team runs
    score_pit      INTEGER,        -- pitching team runs
    game_ms        INTEGER         -- master-clock timestamp of the pitch
);

CREATE TABLE batted_ball (
    id           INTEGER PRIMARY KEY,
    pitch_id     INTEGER NOT NULL REFERENCES pitch(id),
    batter_id    INTEGER NOT NULL REFERENCES player(id),
    -- contact detail, captured on EVERY ball in play including outs:
    hardness     TEXT,             -- 'soft','medium','hard','scorched'
    launch       TEXT,             -- 'ground','line','fly','popup','blooper'
    spray_zone   TEXT,             -- 'LF','LCF','CF','RCF','RF','IF_pull','IF_mid','IF_oppo'
    depth        TEXT,             -- 'infield','shallow','medium','deep','wall'
    fielder      TEXT,             -- position that fielded it: 'SS','RF',...
    caught       INTEGER DEFAULT 0,-- 1 = caught on the fly (hard-hit OUT signal)
    pull_oppo    TEXT,             -- 'pull','center','oppo'
    exit_velo_est REAL,            -- nullable; from CV/TrackMan later
    result       TEXT,             -- 'single','double','triple','hr','flyout','groundout','lineout','error'
    rbi          INTEGER DEFAULT 0,
    runs_scored  INTEGER DEFAULT 0,
    game_ms      INTEGER
);

-- Generic timestamped tag, so anything reviewable from any angle links here.
CREATE TABLE event (
    id           INTEGER PRIMARY KEY,
    game_id      INTEGER NOT NULL REFERENCES game(id),
    game_ms      INTEGER NOT NULL, -- position on the master clock
    kind         TEXT NOT NULL,    -- 'pitch','batted_ball','defensive','note'
    ref_id       INTEGER,          -- id in the corresponding table
    created_by   TEXT,             -- 'human' | 'cv'
    notes        TEXT
);

-- ---------------------------------------------------------------------------
-- Derived stats are all GROUP BY over the event log. A few examples:
-- ---------------------------------------------------------------------------

-- 1) Every hard-hit ball to right-center by a player this season:
-- SELECT g.played_on, bb.hardness, bb.spray_zone, bb.depth, bb.result
-- FROM batted_ball bb
-- JOIN player p ON p.id = bb.batter_id
-- JOIN pitch  pi ON pi.id = bb.pitch_id
-- JOIN at_bat ab ON ab.id = pi.at_bat_id
-- JOIN game   g  ON g.id = ab.game_id
-- WHERE p.name = 'Jordan Rivera'
--   AND bb.hardness IN ('hard','scorched')
--   AND bb.spray_zone IN ('RF','RCF')
-- ORDER BY g.played_on;

-- 2) Hard-hit OUTS (the "crushed it right at someone" / bad-luck signal):
-- SELECT p.name, COUNT(*) AS hard_hit_outs
-- FROM batted_ball bb JOIN player p ON p.id = bb.batter_id
-- WHERE bb.hardness IN ('hard','scorched') AND bb.caught = 1
-- GROUP BY p.name ORDER BY hard_hit_outs DESC;

-- 3) Contact quality with runners in scoring position:
-- SELECT p.name,
--        SUM(bb.hardness IN ('hard','scorched')) AS hard,
--        COUNT(*) AS balls_in_play
-- FROM batted_ball bb
-- JOIN pitch pi ON pi.id = bb.pitch_id
-- JOIN player p ON p.id = bb.batter_id
-- WHERE (pi.on_2b = 1 OR pi.on_3b = 1)          -- RISP
-- GROUP BY p.name;

-- 4) Pitcher: hard-contact allowed by count leverage:
-- SELECT pit.name,
--        (pi.strikes = 2) AS two_strike,
--        SUM(bb.hardness IN ('hard','scorched')) AS hard_allowed,
--        COUNT(*) AS bip
-- FROM batted_ball bb
-- JOIN pitch  pi ON pi.id = bb.pitch_id
-- JOIN at_bat ab ON ab.id = pi.at_bat_id
-- JOIN player pit ON pit.id = ab.pitcher_id
-- GROUP BY pit.name, two_strike;
