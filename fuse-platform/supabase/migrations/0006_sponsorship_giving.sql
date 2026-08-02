-- ============================================================================
-- Fuse Platform — Migration 0006: Sponsorship CRM + giving modules
--
-- Completes the reusable spine other modules lean on:
--   * Package inventory guard — nothing can be oversold (general, all kinds).
--   * Sponsorship exclusivity guard — an exclusive category sells once per
--     campaign (SPON-002).
--   * Sponsor deliverables / proof-of-performance (SPON-003).
--   * Org-defined supporter membership tiers (plan.org_id) reusing the
--     subscription/entitlement machinery.
--   * Crowdfunding pages under a parent campaign; funds flow to the org.
--   * Recurring donations, corporate matching, and grant workflow (Phase 3
--     tables, kept compact).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Package inventory — increment qty_sold and refuse to oversell.
--    Fires for every order_item (registrations, tickets, sponsorships, ...).
-- ---------------------------------------------------------------------------
create or replace function guard_package_inventory()
returns trigger language plpgsql as $$
declare pk package%rowtype;
begin
  if new.package_id is null then return new; end if;
  select * into pk from package where id = new.package_id for update;
  if pk.id is null then return new; end if;

  if pk.qty_total is not null and pk.qty_sold + new.qty > pk.qty_total then
    raise exception 'package % oversold: %+% exceeds % available',
      pk.id, pk.qty_sold, new.qty, pk.qty_total;
  end if;

  update package set qty_sold = qty_sold + new.qty where id = pk.id;
  return new;
end $$;

create trigger trg_pkg_inventory
  before insert on order_item
  for each row execute function guard_package_inventory();

-- ---------------------------------------------------------------------------
-- 2. Sponsorship exclusivity — one sponsor per exclusive category per campaign.
-- ---------------------------------------------------------------------------
create or replace function guard_sponsorship_exclusivity()
returns trigger language plpgsql as $$
declare pk package%rowtype; v_conflict int;
begin
  if new.package_id is null then return new; end if;
  select * into pk from package where id = new.package_id;
  if pk.kind <> 'sponsorship' or pk.exclusive_category is null then return new; end if;

  select count(*) into v_conflict
  from order_item oi
  join "order" o  on o.id = oi.order_id and o.status <> 'canceled'
  join package p2 on p2.id = oi.package_id
  where p2.campaign_id = pk.campaign_id
    and p2.exclusive_category = pk.exclusive_category
    and p2.id <> pk.id;

  if v_conflict > 0 then
    raise exception 'sponsorship category "%" is already sold exclusively in this campaign',
      pk.exclusive_category;
  end if;
  return new;
end $$;

create trigger trg_sponsorship_exclusivity
  before insert on order_item
  for each row execute function guard_sponsorship_exclusivity();

-- ---------------------------------------------------------------------------
-- 3. Sponsor deliverables (proof of performance)
-- ---------------------------------------------------------------------------
create table sponsor_deliverable (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organization(id) on delete cascade,
  sponsor_id   uuid not null references sponsor(id) on delete cascade,
  campaign_id  uuid references campaign(id) on delete set null,
  description  text not null,
  status       text not null default 'pending',    -- pending|in_progress|fulfilled
  proof_url    text,
  due_date     date,
  created_at   timestamptz not null default now()
);
create index on sponsor_deliverable (org_id);
alter table sponsor_deliverable enable row level security;
create policy sponsor_deliverable_rw on sponsor_deliverable
  using (is_org_member(org_id) or is_platform_admin())
  with check (is_org_member(org_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- 4. Org-defined supporter membership tiers — plans scoped to an org.
--    plan.org_id null = platform plan; set = an org's supporter membership.
-- ---------------------------------------------------------------------------
alter table plan add column org_id uuid references organization(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 5. Crowdfunding — player/team pages under a parent campaign. Funds go to the
--    org (never a minor); attribution is carried on order_item (0001).
-- ---------------------------------------------------------------------------
alter table campaign add column parent_campaign_id uuid references campaign(id) on delete set null;

create table crowdfunding_page (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaign(id) on delete cascade,  -- parent
  org_id       uuid not null references organization(id) on delete cascade,
  player_user  uuid references app_user(id) on delete set null,
  team_id      uuid references team(id) on delete set null,
  goal_cents   bigint,
  story        text,
  slug         citext,
  created_at   timestamptz not null default now(),
  unique (campaign_id, slug)
);
create index on crowdfunding_page (org_id);
alter table crowdfunding_page enable row level security;
create policy crowdfunding_public_read on crowdfunding_page for select using (true);
create policy crowdfunding_write on crowdfunding_page
  using (is_org_member(org_id) or is_platform_admin())
  with check (is_org_member(org_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- 6. Recurring donations (the fake/real Stripe subscription drives charges)
-- ---------------------------------------------------------------------------
create table recurring_donation (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organization(id) on delete cascade,
  supporter_id   uuid references supporter(id) on delete set null,
  amount_cents   bigint not null,
  interval       text not null default 'month',    -- month|year
  covers_fees    boolean not null default false,
  status         text not null default 'active',    -- active|paused|canceled
  next_charge_at timestamptz,
  stripe_subscription_id text,
  created_at     timestamptz not null default now()
);
create index on recurring_donation (org_id);
alter table recurring_donation enable row level security;
create policy recurring_donation_rw on recurring_donation
  using (is_org_member(org_id) or is_platform_admin())
  with check (is_org_member(org_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- 7. Corporate matching (Phase 3, compact)
-- ---------------------------------------------------------------------------
create table matching_gift (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organization(id) on delete cascade,
  order_id      uuid references "order"(id) on delete set null,
  employer      text,
  status        text not null default 'pending',    -- pending|submitted|received
  match_cents   bigint,
  created_at    timestamptz not null default now()
);
create index on matching_gift (org_id);
alter table matching_gift enable row level security;
create policy matching_gift_rw on matching_gift
  using (is_org_member(org_id) or is_platform_admin())
  with check (is_org_member(org_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- 8. Grants (Phase 3, compact)
-- ---------------------------------------------------------------------------
create table grant_opportunity (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  funder       text,
  geography    text,
  amount_cents bigint,
  deadline     date,
  url          text,
  created_at   timestamptz not null default now()
);
alter table grant_opportunity enable row level security;
create policy grant_opp_public_read on grant_opportunity for select using (true);
create policy grant_opp_admin_write on grant_opportunity for all using (is_platform_admin()) with check (is_platform_admin());

create table grant_application (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organization(id) on delete cascade,
  opportunity_id uuid references grant_opportunity(id) on delete set null,
  status         text not null default 'draft',      -- draft|submitted|awarded|declined
  narrative      text,
  requested_cents bigint,
  awarded_cents  bigint,
  submitted_at   timestamptz,
  created_at     timestamptz not null default now()
);
create index on grant_application (org_id);
alter table grant_application enable row level security;
create policy grant_app_rw on grant_application
  using (is_org_member(org_id) or is_platform_admin())
  with check (is_org_member(org_id) or is_platform_admin());
