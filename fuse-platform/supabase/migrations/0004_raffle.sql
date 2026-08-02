-- ============================================================================
-- Fuse Platform — Migration 0004: Raffle compliance engine
--
-- Raffles are regulated gaming; rules vary by jurisdiction. This migration
-- makes compliance structural, not advisory:
--   * A jurisdiction matrix gates publication (RAFF-001).
--   * Rules are versioned and supporter acknowledgment is tied to the version
--     they agreed to (RAFF-009).
--   * Once entries are locked, the eligible set is immutable (RAFF-007).
--   * The draw is seeded, reproducible, and leaves an audit trail (RAFF-008, §8.4).
-- Everything hangs off the shared campaign/order spine from 0001.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Jurisdiction matrix — the switchboard that turns regulated features on/off.
-- ---------------------------------------------------------------------------
create table jurisdiction_rule (
  id               uuid primary key default gen_random_uuid(),
  jurisdiction     text not null,                 -- e.g. 'US-NJ'
  module           text not null,                 -- 'raffle'
  allowed          boolean not null default false,
  requires_license boolean not null default false,
  min_age          int,
  notes            text,
  unique (jurisdiction, module)
);
alter table jurisdiction_rule enable row level security;
create policy jrule_public_read on jurisdiction_rule for select using (true);
create policy jrule_admin_write on jurisdiction_rule for all using (is_platform_admin()) with check (is_platform_admin());

-- ---------------------------------------------------------------------------
-- 2. Raffle core — 1:1 with a campaign of type 'raffle'.
-- ---------------------------------------------------------------------------
create table raffle (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid not null unique references campaign(id) on delete cascade,
  org_id            uuid not null references organization(id) on delete cascade,
  draw_at           timestamptz,
  license_number    text,
  entries_locked_at timestamptz,
  snapshot_hash     text,                          -- md5 of the ordered eligible set
  created_at        timestamptz not null default now()
);
create index on raffle (org_id);

create table raffle_prize (
  id           uuid primary key default gen_random_uuid(),
  raffle_id    uuid not null references raffle(id) on delete cascade,
  title        text not null,
  fmv_cents    bigint not null default 0,          -- fair-market value (tax/reporting)
  winner_order int not null default 1,
  media        jsonb not null default '[]',
  sponsor_id   uuid references sponsor(id) on delete set null
);
create index on raffle_prize (raffle_id);

create table raffle_rule_version (
  id           uuid primary key default gen_random_uuid(),
  raffle_id    uuid not null references raffle(id) on delete cascade,
  version      int not null,
  body         text not null,
  published_at timestamptz,
  unique (raffle_id, version)
);

create table raffle_entry (
  id           uuid primary key default gen_random_uuid(),
  raffle_id    uuid not null references raffle(id) on delete cascade,
  org_id       uuid not null references organization(id) on delete cascade,
  supporter_id uuid references supporter(id) on delete set null,
  order_id     uuid references "order"(id) on delete set null,
  entry_number bigint not null,
  rules_version int not null,
  created_at   timestamptz not null default now(),
  unique (raffle_id, entry_number)
);
create index on raffle_entry (raffle_id);

create table raffle_acknowledgment (
  id            uuid primary key default gen_random_uuid(),
  raffle_id     uuid not null references raffle(id) on delete cascade,
  supporter_id  uuid references supporter(id) on delete set null,
  rules_version int not null,
  ack_at        timestamptz not null default now()
);

create table raffle_draw (
  id            uuid primary key default gen_random_uuid(),
  raffle_id     uuid not null references raffle(id) on delete cascade,
  method        text not null default 'seeded-hash',
  seed          text not null,
  snapshot_hash text,
  operator      uuid references app_user(id) on delete set null,
  drawn_at      timestamptz not null default now()
);

create table raffle_winner (
  id           uuid primary key default gen_random_uuid(),
  draw_id      uuid not null references raffle_draw(id) on delete cascade,
  prize_id     uuid not null references raffle_prize(id) on delete cascade,
  entry_id     uuid not null references raffle_entry(id) on delete restrict,
  status       text not null default 'pending',    -- pending|notified|accepted|forfeited
  is_alternate boolean not null default false
);

-- org-scoped RLS on the raffle tables that carry org_id
alter table raffle       enable row level security;
alter table raffle_entry enable row level security;
create policy raffle_rw       on raffle       using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());
create policy raffle_entry_rw on raffle_entry using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- 3. Publish gate — a raffle campaign cannot go 'published' unless the
--    jurisdiction allows it, a license is on file where required, and at least
--    one rule version is published.
-- ---------------------------------------------------------------------------
create or replace function raffle_can_publish(p_campaign uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_raffle raffle%rowtype;
  v_rule   jurisdiction_rule%rowtype;
  v_juris  text;
  v_rules  int;
begin
  select * into v_raffle from raffle where campaign_id = p_campaign;
  if v_raffle.id is null then return false; end if;

  select jurisdiction into v_juris from organization where id = v_raffle.org_id;
  select * into v_rule from jurisdiction_rule where jurisdiction = v_juris and module = 'raffle';
  if v_rule.id is null or not v_rule.allowed then return false; end if;
  if v_rule.requires_license and coalesce(v_raffle.license_number, '') = '' then return false; end if;

  select count(*) into v_rules from raffle_rule_version
    where raffle_id = v_raffle.id and published_at is not null;
  return v_rules > 0;
end $$;

create or replace function guard_raffle_publish()
returns trigger language plpgsql as $$
begin
  if new.type = 'raffle' and new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if not raffle_can_publish(new.id) then
      raise exception 'raffle % cannot publish: jurisdiction/license/rules gate not satisfied', new.id;
    end if;
  end if;
  return new;
end $$;

create trigger trg_guard_raffle_publish
  before insert or update on campaign
  for each row execute function guard_raffle_publish();

-- ---------------------------------------------------------------------------
-- 4. Entry immutability — once locked, the eligible set cannot change.
-- ---------------------------------------------------------------------------
create or replace function guard_entry_immutable()
returns trigger language plpgsql as $$
declare v_locked timestamptz;
begin
  select entries_locked_at into v_locked
    from raffle where id = coalesce(new.raffle_id, old.raffle_id);
  if v_locked is not null then
    raise exception 'raffle entries locked at %; the eligible set is immutable', v_locked;
  end if;
  return coalesce(new, old);
end $$;

create trigger trg_entry_immutable
  before insert or update or delete on raffle_entry
  for each row execute function guard_entry_immutable();

-- ---------------------------------------------------------------------------
-- 5. Lock + draw — reproducible, seeded, audit-logged.
-- ---------------------------------------------------------------------------
create or replace function raffle_lock_entries(p_raffle uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_hash text;
begin
  select org_id into v_org from raffle where id = p_raffle for update;
  if v_org is null then raise exception 'raffle % not found', p_raffle; end if;

  select md5(coalesce(string_agg(entry_number::text, ',' order by entry_number), ''))
    into v_hash from raffle_entry where raffle_id = p_raffle;

  update raffle set entries_locked_at = now(), snapshot_hash = v_hash where id = p_raffle;

  insert into audit_log (org_id, actor_user, action, object_type, object_id, new_state)
  values (v_org, auth.uid(), 'raffle.lock', 'raffle', p_raffle,
          jsonb_build_object('snapshot_hash', v_hash));
  return v_hash;
end $$;

-- One winner per prize, chosen deterministically by md5(seed:entry_number),
-- excluding entries already won. Same seed + same locked set => same winners,
-- so anyone can reproduce and verify the draw from the audit record.
create or replace function raffle_run_draw(p_raffle uuid, p_seed text, p_method text default 'seeded-hash')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_org      uuid;
  v_locked   timestamptz;
  v_snapshot text;
  v_draw     uuid := gen_random_uuid();
  v_used     uuid[] := '{}';
  v_entry    uuid;
  pr         raffle_prize%rowtype;
begin
  select org_id, entries_locked_at, snapshot_hash into v_org, v_locked, v_snapshot
    from raffle where id = p_raffle for update;
  if v_org is null then raise exception 'raffle % not found', p_raffle; end if;
  if v_locked is null then raise exception 'entries must be locked before drawing'; end if;

  insert into raffle_draw (id, raffle_id, method, seed, snapshot_hash, operator)
  values (v_draw, p_raffle, p_method, p_seed, v_snapshot, auth.uid());

  for pr in select * from raffle_prize where raffle_id = p_raffle order by winner_order loop
    select e.id into v_entry
      from raffle_entry e
      where e.raffle_id = p_raffle and not (e.id = any(v_used))
      order by md5(p_seed || ':' || e.entry_number::text)
      limit 1;
    if v_entry is null then
      raise exception 'not enough eligible entries to award all prizes';
    end if;
    v_used := array_append(v_used, v_entry);
    insert into raffle_winner (draw_id, prize_id, entry_id) values (v_draw, pr.id, v_entry);
  end loop;

  insert into audit_log (org_id, actor_user, action, object_type, object_id, new_state)
  values (v_org, auth.uid(), 'raffle.draw', 'raffle', p_raffle,
          jsonb_build_object('draw_id', v_draw, 'seed', p_seed, 'snapshot_hash', v_snapshot));
  return v_draw;
end $$;
