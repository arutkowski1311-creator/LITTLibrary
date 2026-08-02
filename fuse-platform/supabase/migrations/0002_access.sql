-- ============================================================================
-- Fuse Platform — Migration 0002: Access control & entitlement sync
--   * Platform-admin bypass (global, not org-scoped)
--   * Public-read for published campaigns, packages, and course listings
--   * Consumer (parent/viewer) self-access to their own identity/subs/entitlements
--   * subscription -> entitlement sync (the runtime grant modules check)
-- Webhook *handlers* live in the Next.js app; they write to `subscription`
-- (service role), and the trigger below keeps `entitlement` in lockstep.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Platform administrators (global scope, outside the org membership model)
-- ---------------------------------------------------------------------------
create table platform_admin (
  user_id     uuid primary key references app_user(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create or replace function is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admin where user_id = auth.uid());
$$;

-- Permissive policies OR together, so these grant platform admins full access
-- on top of the org-member policies from 0001.
do $$
declare t text;
begin
  foreach t in array array[
    'organization','team','membership','supporter','sponsor','campaign','event',
    'package','order','ledger_entry','golf_outing','audit_log'
  ] loop
    execute format(
      'create policy %I on %I as permissive for all using (is_platform_admin()) with check (is_platform_admin());',
      t || '_admin_all', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Public read for published fundraising surfaces (anonymous supporters)
-- ---------------------------------------------------------------------------
create policy campaign_public_read on campaign
  for select using (status = 'published');

create policy package_public_read on package
  for select using (exists (
    select 1 from campaign c where c.id = package.campaign_id and c.status = 'published'
  ));

-- Course listings are a public marketplace; writes stay central for now.
alter table golf_course       enable row level security;
alter table golf_package      enable row level security;
alter table golf_availability enable row level security;

create policy course_public_read       on golf_course       for select using (true);
create policy course_admin_write        on golf_course       for all using (is_platform_admin()) with check (is_platform_admin());
create policy course_pkg_public_read    on golf_package      for select using (true);
create policy course_pkg_admin_write    on golf_package      for all using (is_platform_admin()) with check (is_platform_admin());
create policy course_avail_public_read  on golf_availability for select using (true);
create policy course_avail_admin_write  on golf_availability for all using (is_platform_admin()) with check (is_platform_admin());

-- Plans power the public pricing page.
alter table plan enable row level security;
create policy plan_public_read on plan for select using (true);
create policy plan_admin_write on plan for all using (is_platform_admin()) with check (is_platform_admin());

-- ---------------------------------------------------------------------------
-- 3. Consumer self-access (parents/viewers own their identity + subscriptions)
-- ---------------------------------------------------------------------------
alter table app_user       enable row level security;
alter table subscription   enable row level security;
alter table entitlement    enable row level security;
alter table billing_invoice enable row level security;

create policy app_user_self on app_user
  using (id = auth.uid()) with check (id = auth.uid());

-- A subscription/entitlement is visible to its subject: the consumer who owns
-- it, any member of the owning org, or a platform admin.
create policy subscription_access on subscription using (
  user_id = auth.uid()
  or (org_id is not null and is_org_member(org_id))
  or is_platform_admin()
);
create policy entitlement_access on entitlement using (
  user_id = auth.uid()
  or (org_id is not null and is_org_member(org_id))
  or is_platform_admin()
);

-- A supporter row is also visible to the linked consumer (guest rows stay
-- org-only via the 0001 policy).
create policy supporter_self_read on supporter
  for select using (user_id = auth.uid());

create policy billing_invoice_access on billing_invoice using (
  exists (
    select 1 from subscription s
    where s.id = billing_invoice.subscription_id
      and (s.user_id = auth.uid()
           or (s.org_id is not null and is_org_member(s.org_id))
           or is_platform_admin())
  )
);

-- ---------------------------------------------------------------------------
-- 4. subscription -> entitlement sync
--    When a subscription is created or its status/plan changes, rebuild the
--    entitlement rows it sources. Active/trialing grants the plan's modules;
--    any other status revokes them.
-- ---------------------------------------------------------------------------
create or replace function sync_entitlements()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from entitlement where source_subscription = new.id;

  if new.status in ('active','trialing') then
    insert into entitlement (org_id, user_id, module_key, source_subscription)
    select new.org_id, new.user_id, m, new.id
    from plan p, unnest(p.modules) as m
    where p.id = new.plan_id;
  end if;

  return new;
end $$;

create trigger trg_sync_entitlements
  after insert or update of status, plan_id on subscription
  for each row execute function sync_entitlements();

-- Runtime check any module can call: "does this org/user hold this module?"
create or replace function has_entitlement(p_module text, p_org uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from entitlement e
    where e.module_key = p_module
      and ( (p_org is not null and e.org_id = p_org)
            or (p_org is null and e.user_id = auth.uid()) )
  );
$$;
