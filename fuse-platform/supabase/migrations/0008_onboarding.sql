-- ============================================================================
-- Fuse Platform — Migration 0008: Org onboarding
--
-- Adds org-level annual goal + Connect status, and a create_organization()
-- function that atomically provisions a new org. This solves the RLS
-- chicken-and-egg: a user can't satisfy is_org_member(id) to insert an org row
-- until a membership exists. The SECURITY DEFINER function creates the org,
-- the owner membership, and the module-entitlement plan + subscription in one
-- transaction (the entitlement trigger from 0002 then fires).
-- ============================================================================

alter table organization
  add column annual_goal_cents bigint,
  add column onboarded_at timestamptz,
  add column connect_status text not null default 'none';   -- none | pending | active

create or replace function create_organization(
  p_public_name text,
  p_legal_name  text,
  p_entity      org_entity_type,
  p_jurisdiction text,
  p_primary     text,
  p_accent      text,
  p_goal_cents  bigint,
  p_connect     boolean,
  p_modules     text[]
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_org  uuid;
  v_plan uuid;
begin
  if v_uid is null or v_uid = '00000000-0000-0000-0000-000000000000' then
    raise exception 'must be signed in to create an organization';
  end if;

  insert into organization (
    public_name, legal_name, entity_type, jurisdiction, brand_primary, brand_accent,
    annual_goal_cents, onboarded_at, connect_status, stripe_connect_id
  ) values (
    p_public_name, p_legal_name, p_entity, coalesce(nullif(p_jurisdiction,''),'US-NJ'),
    p_primary, p_accent, p_goal_cents, now(),
    case when p_connect then 'active' else 'none' end,
    case when p_connect then 'acct_fake_' || substr(md5(p_public_name || v_uid::text), 1, 16) end
  ) returning id into v_org;

  insert into membership (org_id, user_id, role) values (v_org, v_uid, 'org_owner');

  -- Grant the selected modules via an org plan + active subscription.
  if array_length(p_modules, 1) is not null then
    insert into plan (audience, code, name, modules, org_id)
    values ('org', 'org_' || substr(v_org::text, 1, 8), p_public_name || ' Plan', p_modules, v_org)
    returning id into v_plan;

    insert into subscription (plan_id, org_id, status) values (v_plan, v_org, 'active');
  end if;

  return v_org;
end $$;
