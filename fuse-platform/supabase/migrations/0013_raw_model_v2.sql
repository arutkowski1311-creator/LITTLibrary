-- ============================================================================
-- Fuse Platform — Migration 0013: RAW model v2 (pillars + psychology)
--
-- Restructures the RAW development index into three weighted pillars, and
-- expands the psychological/makeup dimension into seven coach-rated sub-traits
-- so the mental side is measured, not hand-waved:
--
--   Physical      (0.30): Speed, Power, Arm, Athleticism
--   Technical     (0.40): Hitting, Fielding, Throwing, Baseball IQ
--   Psychological (0.30): Compete, Coachability, Resilience, Focus, Poise,
--                         Work Ethic, Leadership
--
-- overall = pillar-weighted mean of pillar scores; pillar = domain-weighted
-- mean of its domains. Each raw_score can be objective (from measurables) or a
-- coach rating, and is tied to an evaluation session so scores trend over time.
-- ============================================================================

create table raw_pillar (
  id     uuid primary key default gen_random_uuid(),
  code   text unique not null,
  name   text not null,
  weight numeric not null default 1,
  sort   int not null default 0
);

alter table raw_domain
  add column pillar_id uuid references raw_pillar(id) on delete set null,
  add column kind text not null default 'subjective',   -- objective | subjective
  add column sort int not null default 0;

-- A coach's rating session: a pass over the roster for one domain (or overall),
-- on a date. Its scores are what let the RAW number move as players develop.
create table evaluation (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organization(id) on delete cascade,
  team_id    uuid references team(id) on delete set null,
  evaluator  uuid references app_user(id) on delete set null,
  domain_id  uuid references raw_domain(id) on delete set null,
  as_of      date not null default current_date,
  notes      text,
  created_at timestamptz not null default now()
);
create index on evaluation (org_id);
alter table evaluation enable row level security;
create policy evaluation_rw on evaluation using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());

alter table raw_score
  add column evaluation_id uuid references evaluation(id) on delete set null,
  add column evaluator uuid references app_user(id) on delete set null,
  add column method text not null default 'coach';        -- coach | objective | relative

-- ---------------------------------------------------------------------------
-- Pillar-weighted rollup. player_raw_latest (0011) already gives the newest
-- score per (player, domain); these roll it up through pillars.
-- ---------------------------------------------------------------------------
drop view if exists player_raw_overall;

create view player_pillar_score with (security_invoker = true) as
select l.player_id, l.org_id,
       p.id as pillar_id, p.code as pillar_code, p.name as pillar_name, p.weight as pillar_weight, p.sort,
       round(sum(l.score * d.weight) / nullif(sum(d.weight), 0)) as score
from player_raw_latest l
join raw_domain d on d.id = l.domain_id
join raw_pillar p on p.id = d.pillar_id
group by l.player_id, l.org_id, p.id, p.code, p.name, p.weight, p.sort;

create view player_raw_overall with (security_invoker = true) as
select ps.player_id, ps.org_id,
       round(sum(ps.score * ps.pillar_weight) / nullif(sum(ps.pillar_weight), 0)) as overall
from player_pillar_score ps
group by ps.player_id, ps.org_id;
