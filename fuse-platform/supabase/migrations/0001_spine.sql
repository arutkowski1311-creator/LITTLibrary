-- ============================================================================
-- Fuse Platform — Migration 0001: The Spine
-- Phase 0 foundation + Golf module, multi-tenant on Supabase Postgres + RLS.
--
-- Design decisions locked with the founder:
--   * Facilitator model: orgs are Stripe *Connect* accounts; the platform never
--     holds fundraising funds. Two payment rails live here:
--       - Connect rail (money to the ORG): order / payment / payout / ledger
--       - Billing rail (money to the PLATFORM): subscription / billing_invoice
--   * Layered subscriptions: orgs AND consumers (parents/viewers) subscribe;
--     entitlements gate every module. Fundraising is one module among many.
--   * Golf is the first end-to-end wedge: deposit -> go/no-go -> guaranteed
--     count -> settlement -> reconciled payout.
--   * The ledger is the crown jewel: every financial event is a balanced,
--     append-only allocation. Get this right and every other module reuses it.
-- ============================================================================

create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists citext;         -- case-insensitive emails/slugs

-- ---------------------------------------------------------------------------
-- 0. Enums
-- ---------------------------------------------------------------------------
create type org_entity_type   as enum ('nonprofit_501c3','nonprofit_other','for_profit','unincorporated');
create type member_role       as enum (
  'platform_admin','org_owner','org_admin','finance_manager','fundraising_manager',
  'team_manager','volunteer','sponsor','supporter','player','auditor'
);
create type plan_audience     as enum ('org','consumer');       -- who buys the plan
create type subscription_status as enum ('trialing','active','past_due','canceled','incomplete');
create type campaign_type     as enum ('golf','duel','raffle','auction','store','donation','crowdfunding','membership','event','streaming');
create type campaign_status   as enum ('draft','in_review','published','closed','settled','archived');
create type package_kind      as enum ('registration','sponsorship','ticket','ad','product','entry');
create type order_status      as enum ('pending','paid','partially_refunded','refunded','failed','canceled');
create type ledger_party      as enum ('org','platform','partner','tax','payment_fee','fund','refund','attribution');
create type ledger_direction  as enum ('debit','credit');
create type golf_reg_type     as enum ('foursome','individual','dinner_only','sponsor');
create type go_no_go          as enum ('pending','go','no_go');
create type task_status       as enum ('todo','in_progress','done','blocked');

-- ---------------------------------------------------------------------------
-- 1. Tenancy & identity
--    organization is the tenant root; every scoped row carries org_id.
-- ---------------------------------------------------------------------------
create table organization (
  id                uuid primary key default gen_random_uuid(),
  public_name       text not null,
  legal_name        text,
  entity_type       org_entity_type not null default 'nonprofit_501c3',
  tax_id            text,                          -- EIN, encrypted at app layer
  jurisdiction      text,                          -- e.g. 'US-NJ'
  logo_url          text,
  brand_primary     text,                          -- hex
  brand_accent      text,
  stripe_connect_id text,                          -- acct_... (fundraising rail)
  stripe_customer_id text,                         -- cus_... (billing rail, org as payer)
  created_at        timestamptz not null default now()
);

-- app_user mirrors auth.users (Supabase Auth owns credentials/MFA).
create table app_user (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  email         citext,
  phone         text,
  stripe_customer_id text,                         -- consumer billing rail
  created_at    timestamptz not null default now()
);

create table team (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organization(id) on delete cascade,
  name        text not null,
  program     text,
  season      text,
  created_at  timestamptz not null default now()
);

-- RBAC: a user's role is scoped to an org and optionally a single team.
create table membership (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organization(id) on delete cascade,
  user_id     uuid not null references app_user(id) on delete cascade,
  role        member_role not null,
  team_id     uuid references team(id) on delete cascade,   -- null = org-wide
  expires_at  timestamptz,                                  -- for delegated volunteer access
  created_at  timestamptz not null default now(),
  unique (org_id, user_id, role, team_id)
);
create index on membership (user_id);
create index on membership (org_id);

-- ---------------------------------------------------------------------------
-- 2. Subscription & entitlement (the layer the pricing model demands)
--    A plan is sold to orgs OR consumers. A subscription is an active purchase.
--    An entitlement is the *derived* grant that modules check at runtime.
-- ---------------------------------------------------------------------------
create table plan (
  id            uuid primary key default gen_random_uuid(),
  audience      plan_audience not null,
  code          text not null unique,              -- 'org_pro', 'parent_stream', ...
  name          text not null,
  stripe_price_id text,                             -- Stripe Billing price
  modules       text[] not null default '{}',      -- entitlement keys this plan grants
  created_at    timestamptz not null default now()
);

-- Exactly one of org_id / user_id is set (the subscriber).
create table subscription (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid not null references plan(id),
  org_id            uuid references organization(id) on delete cascade,
  user_id           uuid references app_user(id) on delete cascade,
  status            subscription_status not null default 'trialing',
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at        timestamptz not null default now(),
  check ( (org_id is not null) <> (user_id is not null) )   -- exactly one subject
);
create index on subscription (org_id);
create index on subscription (user_id);

-- Flattened grant used everywhere: "can this subject use this module?"
create table entitlement (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references organization(id) on delete cascade,
  user_id       uuid references app_user(id) on delete cascade,
  module_key    text not null,                     -- 'golf','streaming','raw_report',...
  source_subscription uuid references subscription(id) on delete cascade,
  granted_at    timestamptz not null default now(),
  check ( (org_id is not null) <> (user_id is not null) )
);
create index on entitlement (org_id, module_key);
create index on entitlement (user_id, module_key);

-- ---------------------------------------------------------------------------
-- 3. Commerce & fundraising spine (shared by every money-in-motion module)
-- ---------------------------------------------------------------------------
create table supporter (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organization(id) on delete cascade,
  user_id     uuid references app_user(id) on delete set null,  -- may be a guest
  full_name   text,
  email       citext,
  phone       text,
  consent_marketing boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on supporter (org_id);

create table sponsor (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organization(id) on delete cascade,
  business    text not null,
  contact_name text,
  contact_email citext,
  category    text,                                -- for exclusivity/prohibited controls
  notes       text,
  renewal_date date,
  created_at  timestamptz not null default now()
);
create index on sponsor (org_id);

create table campaign (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organization(id) on delete cascade,
  type        campaign_type not null,
  title       text not null,
  slug        citext,                              -- public page
  goal_cents  bigint,
  opens_at    timestamptz,
  closes_at   timestamptz,
  status      campaign_status not null default 'draft',
  media       jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index on campaign (org_id, type);

create table event (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organization(id) on delete cascade,
  campaign_id uuid references campaign(id) on delete set null,
  name        text not null,
  starts_at   timestamptz,
  location    text,
  capacity    int,
  created_at  timestamptz not null default now()
);
create index on event (org_id);

-- A package is any limited sellable right (registration/sponsorship/ticket/ad/product/entry).
create table package (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organization(id) on delete cascade,
  campaign_id uuid references campaign(id) on delete cascade,
  event_id    uuid references event(id) on delete cascade,
  kind        package_kind not null,
  name        text not null,
  price_cents bigint not null default 0,
  qty_total   int,                                 -- null = unlimited
  qty_sold    int not null default 0,
  exclusive_category text,                         -- sponsorship exclusivity guard
  created_at  timestamptz not null default now()
);
create index on package (campaign_id);

create table "order" (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organization(id) on delete cascade,
  supporter_id  uuid references supporter(id) on delete set null,
  subtotal_cents bigint not null default 0,
  fee_cents     bigint not null default 0,          -- payment + platform fee disclosed
  total_cents   bigint not null default 0,
  status        order_status not null default 'pending',
  stripe_payment_intent text,
  created_at    timestamptz not null default now()
);
create index on "order" (org_id, status);

create table order_item (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references "order"(id) on delete cascade,
  package_id    uuid references package(id) on delete set null,
  qty           int not null default 1,
  unit_price_cents bigint not null default 0,
  attribution_player uuid references app_user(id) on delete set null,  -- store credit / crowdfunding
  attribution_team   uuid references team(id) on delete set null
);
create index on order_item (order_id);

-- ---------------------------------------------------------------------------
-- 4. The ledger — append-only, balanced allocations. Never UPDATE/DELETE.
--    Each order (and each payout/refund/fee) fans out into paired entries that
--    sum to zero per transaction group. This is the auditable source of truth.
-- ---------------------------------------------------------------------------
create table ledger_entry (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organization(id) on delete restrict,
  txn_group     uuid not null,                     -- entries sharing this sum to zero
  order_id      uuid references "order"(id) on delete restrict,
  party         ledger_party not null,
  direction     ledger_direction not null,
  amount_cents  bigint not null check (amount_cents >= 0),
  fund          text,                              -- restricted-fund / attribution target
  memo          text,
  created_at    timestamptz not null default now()
);
create index on ledger_entry (org_id, created_at);
create index on ledger_entry (txn_group);
create index on ledger_entry (order_id);

-- Platform-side billing rail (money to the PLATFORM; separate from Connect ledger).
create table billing_invoice (
  id            uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscription(id) on delete cascade,
  amount_cents  bigint not null,
  status        text not null default 'open',       -- open|paid|void|uncollectible
  stripe_invoice_id text,
  period_start  timestamptz,
  period_end    timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. Golf module (the first end-to-end wedge)
-- ---------------------------------------------------------------------------
create table golf_course (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  location      text,
  photos        jsonb not null default '[]',
  amenities     text[],
  min_players   int,
  max_players   int,
  stripe_connect_id text,                           -- course as its own payout party
  created_at    timestamptz not null default now()
);

create table golf_package (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references golf_course(id) on delete cascade,
  name          text not null,
  green_fee_cents bigint not null default 0,
  cart_cents    bigint not null default 0,
  food_cents    bigint not null default 0,
  beverage_cents bigint not null default 0,
  includes      jsonb not null default '{}',        -- range, prizes, signage, AV, gratuity terms
  created_at    timestamptz not null default now()
);

create table golf_availability (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references golf_course(id) on delete cascade,
  date          date not null,
  is_blackout   boolean not null default false,
  unique (course_id, date)
);

-- The org's outing extends event with the commercial workflow fields.
create table golf_outing (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organization(id) on delete cascade,
  event_id          uuid not null references event(id) on delete cascade,
  course_id         uuid not null references golf_course(id) on delete restrict,
  package_id        uuid references golf_package(id) on delete set null,
  proposed_date     date,
  deposit_cents     bigint not null default 0,
  deposit_paid      boolean not null default false,
  go_no_go_deadline date,                            -- 21-day binding decision
  go_no_go_decision go_no_go not null default 'pending',
  go_no_go_at       timestamptz,
  guaranteed_count  int,                             -- locked golfer/meal count
  count_locked_at   timestamptz,
  settled_at        timestamptz,
  created_at        timestamptz not null default now()
);
create index on golf_outing (org_id);

create table golf_registration (
  id            uuid primary key default gen_random_uuid(),
  outing_id     uuid not null references golf_outing(id) on delete cascade,
  order_id      uuid references "order"(id) on delete set null,
  reg_type      golf_reg_type not null,
  golfer_name   text,
  handicap      text,
  pairing_note  text,
  created_at    timestamptz not null default now()
);
create index on golf_registration (outing_id);

create table golf_task (
  id            uuid primary key default gen_random_uuid(),
  outing_id     uuid not null references golf_outing(id) on delete cascade,
  title         text not null,
  due_offset_days int,                               -- 120/90/60/30/21/14/7
  owner_user    uuid references app_user(id) on delete set null,
  status        task_status not null default 'todo',
  created_at    timestamptz not null default now()
);
create index on golf_task (outing_id);

-- ---------------------------------------------------------------------------
-- 6. Audit log — immutable record of financial / permission / draw actions.
-- ---------------------------------------------------------------------------
create table audit_log (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references organization(id) on delete set null,
  actor_user    uuid references app_user(id) on delete set null,
  action        text not null,
  object_type   text,
  object_id     uuid,
  prior_state   jsonb,
  new_state     jsonb,
  created_at    timestamptz not null default now()
);
create index on audit_log (org_id, created_at);

-- ============================================================================
-- 7. Row-Level Security
--    Isolation rule: a user may touch a row only if they hold a membership in
--    that row's org. Public-read tables (published campaigns, course listings)
--    get separate permissive read policies later.
-- ============================================================================
create or replace function is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from membership m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and (m.expires_at is null or m.expires_at > now())
  );
$$;

-- Enable RLS + attach the org-membership policy to every org-scoped table.
do $$
declare t text;
begin
  foreach t in array array[
    'organization','team','membership','supporter','sponsor','campaign','event',
    'package','order','ledger_entry','golf_outing','audit_log'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- organization: member can read/update its own org row.
create policy org_member_rw on organization
  using (is_org_member(id)) with check (is_org_member(id));

-- Generic org-scoped tables keyed on org_id.
create policy team_rw       on team        using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy membership_rw on membership   using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy supporter_rw  on supporter    using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy sponsor_rw    on sponsor      using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy campaign_rw   on campaign     using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy event_rw      on event        using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy package_rw    on package      using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy order_rw      on "order"      using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy golf_outing_rw on golf_outing using (is_org_member(org_id)) with check (is_org_member(org_id));

-- Ledger & audit: readable by org members, but append-only (no update/delete).
create policy ledger_read   on ledger_entry for select using (is_org_member(org_id));
create policy ledger_insert on ledger_entry for insert with check (is_org_member(org_id));
create policy audit_read    on audit_log    for select using (is_org_member(org_id));
create policy audit_insert  on audit_log    for insert with check (org_id is null or is_org_member(org_id));

-- NOTE: platform_admin bypass, public-read policies for published campaigns /
-- course listings, and the consumer (parent/viewer) self-access policies land
-- in migration 0002 alongside the Stripe webhook + entitlement sync functions.
