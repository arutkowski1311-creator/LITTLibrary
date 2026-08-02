-- ============================================================================
-- Fuse Platform — Migration 0012: Scheduling + RSVP
--
-- One team timeline. schedule_event covers practices/tournaments/meetings/team
-- events; games live in the game table (0011); the calendar UI merges both
-- (plus training due-dates). RSVP is polymorphic over a schedule_event OR a
-- game, one-per-user enforced by partial unique indexes.
-- ============================================================================

create type event_type  as enum ('practice','tournament','meeting','team_event','other');
create type rsvp_status as enum ('yes','no','maybe');

create table schedule_event (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organization(id) on delete cascade,
  team_id    uuid references team(id) on delete set null,
  type       event_type not null default 'practice',
  title      text not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  location   text,
  notes      text,
  created_at timestamptz not null default now()
);
create index on schedule_event (org_id, starts_at);

create table rsvp (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organization(id) on delete cascade,
  schedule_event_id uuid references schedule_event(id) on delete cascade,
  game_id           uuid references game(id) on delete cascade,
  user_id           uuid not null references app_user(id) on delete cascade,
  status            rsvp_status not null,
  created_at        timestamptz not null default now(),
  check (num_nonnulls(schedule_event_id, game_id) = 1)   -- exactly one target
);
create unique index rsvp_sched_user on rsvp (schedule_event_id, user_id) where schedule_event_id is not null;
create unique index rsvp_game_user  on rsvp (game_id, user_id)           where game_id is not null;

alter table schedule_event enable row level security;
alter table rsvp           enable row level security;
create policy schedule_event_rw on schedule_event using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());
create policy rsvp_rw           on rsvp           using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());
