-- ============================================================================
-- Fuse Platform — Migration 0011: Sports operations
--
-- The non-fundraising half of the platform: games + scorekeeping (which feeds
-- box-score stats), the RAW development index (weighted domains), and training.
-- Same multi-tenant model: everything org-scoped with RLS. record_pa() is the
-- scorekeeper primitive — one plate appearance updates the batter's line and
-- the game score atomically.
-- ============================================================================

create type game_status as enum ('scheduled','live','final');
create type pa_result   as enum ('single','double','triple','home_run','walk','hbp','strikeout','out','sac','error','fielders_choice');

-- ---------------------------------------------------------------------------
-- Games + box score
-- ---------------------------------------------------------------------------
create table game (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organization(id) on delete cascade,
  team_id    uuid references team(id) on delete set null,
  opponent   text,
  starts_at  timestamptz,
  location   text,
  home       boolean not null default true,
  status     game_status not null default 'scheduled',
  us_runs    int not null default 0,
  them_runs  int not null default 0,
  inning     int not null default 1,
  half       text not null default 'top',
  created_at timestamptz not null default now()
);
create index on game (org_id, starts_at);

create table player_game_stat (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references organization(id) on delete cascade,
  game_id   uuid not null references game(id) on delete cascade,
  player_id uuid not null references app_user(id) on delete cascade,
  ab int not null default 0, h int not null default 0,
  b2 int not null default 0, b3 int not null default 0, hr int not null default 0,
  rbi int not null default 0, bb int not null default 0, so int not null default 0,
  r int not null default 0, sb int not null default 0,
  unique (game_id, player_id)
);
create index on player_game_stat (org_id, player_id);

create table plate_appearance (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organization(id) on delete cascade,
  game_id    uuid not null references game(id) on delete cascade,
  player_id  uuid not null references app_user(id) on delete cascade,
  inning     int, half text, result pa_result not null, rbi int not null default 0,
  created_at timestamptz not null default now()
);
create index on plate_appearance (game_id, created_at);

-- Scorekeeper: record one plate appearance, update the batter's line + score.
create or replace function record_pa(
  p_game uuid, p_player uuid, p_inning int, p_half text, p_result pa_result, p_rbi int default 0
) returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from game where id = p_game for update;
  if v_org is null then raise exception 'game % not found', p_game; end if;
  if not is_org_member(v_org) and not is_platform_admin() then raise exception 'not authorized'; end if;

  insert into plate_appearance(org_id,game_id,player_id,inning,half,result,rbi)
    values (v_org,p_game,p_player,p_inning,p_half,p_result,p_rbi);

  insert into player_game_stat(org_id,game_id,player_id) values (v_org,p_game,p_player)
    on conflict (game_id,player_id) do nothing;

  update player_game_stat set
    ab  = ab  + case when p_result in ('single','double','triple','home_run','strikeout','out','error','fielders_choice') then 1 else 0 end,
    h   = h   + case when p_result in ('single','double','triple','home_run') then 1 else 0 end,
    b2  = b2  + case when p_result='double' then 1 else 0 end,
    b3  = b3  + case when p_result='triple' then 1 else 0 end,
    hr  = hr  + case when p_result='home_run' then 1 else 0 end,
    bb  = bb  + case when p_result='walk' then 1 else 0 end,
    so  = so  + case when p_result='strikeout' then 1 else 0 end,
    rbi = rbi + p_rbi,
    r   = r   + case when p_result='home_run' then 1 else 0 end
   where game_id=p_game and player_id=p_player;

  update game set us_runs = us_runs + p_rbi, status='live' where id=p_game and status<>'final';
end $$;

-- ---------------------------------------------------------------------------
-- RAW development index — weighted domains, latest score per player/domain.
-- ---------------------------------------------------------------------------
create table raw_domain (
  id     uuid primary key default gen_random_uuid(),
  code   text unique not null,
  name   text not null,
  weight numeric not null default 1
);

create table raw_score (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organization(id) on delete cascade,
  player_id  uuid not null references app_user(id) on delete cascade,
  domain_id  uuid not null references raw_domain(id) on delete cascade,
  score      int not null check (score between 0 and 100),
  as_of      date not null default current_date,
  created_at timestamptz not null default now()
);
create index on raw_score (org_id, player_id, domain_id, as_of desc);

create view player_raw_latest with (security_invoker = true) as
select distinct on (player_id, domain_id)
  player_id, org_id, domain_id, score, as_of
from raw_score order by player_id, domain_id, as_of desc;

create view player_raw_overall with (security_invoker = true) as
select l.player_id, l.org_id,
       round(sum(l.score * d.weight) / nullif(sum(d.weight), 0)) as overall
from player_raw_latest l join raw_domain d on d.id = l.domain_id
group by l.player_id, l.org_id;

-- ---------------------------------------------------------------------------
-- Training
-- ---------------------------------------------------------------------------
create table workout (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organization(id) on delete cascade,
  name       text not null,
  category   text,
  description text,
  created_at timestamptz not null default now()
);

create table workout_assignment (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organization(id) on delete cascade,
  workout_id  uuid not null references workout(id) on delete cascade,
  player_id   uuid references app_user(id) on delete cascade,
  team_id     uuid references team(id) on delete cascade,
  assigned_by uuid references app_user(id) on delete set null,
  due_date    date,
  created_at  timestamptz not null default now()
);
create index on workout_assignment (org_id, player_id);

create table workout_log (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organization(id) on delete cascade,
  assignment_id uuid references workout_assignment(id) on delete cascade,
  player_id     uuid references app_user(id) on delete cascade,
  logged_on     date not null default current_date,
  completed     boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now()
);
create index on workout_log (org_id, player_id);

-- ---------------------------------------------------------------------------
-- RLS — org-scoped, except raw_domain which is a shared catalog.
-- ---------------------------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['game','player_game_stat','plate_appearance','raw_score','workout','workout_assignment','workout_log'] loop
    execute format('alter table %I enable row level security;', t);
    execute format('create policy %I on %I using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());', t||'_rw', t);
  end loop;
end $$;

alter table raw_domain enable row level security;
create policy raw_domain_read  on raw_domain for select using (true);
create policy raw_domain_write on raw_domain for all using (is_platform_admin()) with check (is_platform_admin());
