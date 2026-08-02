-- ============================================================================
-- Fuse Platform — Migration 0007: Payment mirroring + checkout->ledger glue
--
-- Mirrors the Stripe objects needed for reconciliation (FIN-002/003) and gives
-- the app ONE function per money event. The FakeStripe adapter calls these in
-- dev; the real Stripe webhook handlers call the same functions in prod. The
-- app never touches ledger_entry directly — it goes through record_payment /
-- record_refund, which keep the mirror table and the ledger in lockstep.
-- ============================================================================

create table payment (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references organization(id) on delete cascade,
  order_id              uuid references "order"(id) on delete set null,
  stripe_payment_intent text,
  gross_cents           bigint not null,
  fee_cents             bigint not null default 0,      -- processor fee
  platform_fee_cents    bigint not null default 0,      -- facilitation fee
  status                text not null default 'succeeded',
  created_at            timestamptz not null default now()
);
create index on payment (org_id);

create table refund (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organization(id) on delete cascade,
  order_id         uuid references "order"(id) on delete set null,
  stripe_refund_id text,
  amount_cents     bigint not null,
  status           text not null default 'succeeded',
  reason           text,
  created_at       timestamptz not null default now()
);
create index on refund (org_id);

create table dispute (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organization(id) on delete cascade,
  order_id          uuid references "order"(id) on delete set null,
  stripe_dispute_id text,
  amount_cents      bigint not null,
  status            text not null default 'needs_response',
  reason            text,
  created_at        timestamptz not null default now()
);
create index on dispute (org_id);

create table payout (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organization(id) on delete cascade,
  stripe_payout_id text,
  amount_cents     bigint not null,
  status           text not null default 'paid',
  arrival_date     date,
  created_at       timestamptz not null default now()
);
create index on payout (org_id);

alter table payment enable row level security;
alter table refund  enable row level security;
alter table dispute enable row level security;
alter table payout  enable row level security;
create policy payment_rw on payment using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());
create policy refund_rw  on refund  using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());
create policy dispute_rw on dispute using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());
create policy payout_rw  on payout  using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- record_payment — the one call for a successful charge. Mirrors the Stripe
-- payment and fans it into the ledger. Idempotent on stripe_payment_intent so
-- a webhook retry can't double-post.
-- ---------------------------------------------------------------------------
create or replace function record_payment(
  p_order        uuid,
  p_gross        bigint,
  p_fee          bigint default 0,
  p_platform_fee bigint default 0,
  p_intent       text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_pay uuid;
begin
  select org_id into v_org from "order" where id = p_order for update;
  if v_org is null then raise exception 'order % not found', p_order; end if;

  if p_intent is not null and exists (select 1 from payment where stripe_payment_intent = p_intent) then
    select id into v_pay from payment where stripe_payment_intent = p_intent;   -- idempotent
    return v_pay;
  end if;

  insert into payment (org_id, order_id, stripe_payment_intent, gross_cents, fee_cents, platform_fee_cents)
  values (v_org, p_order, p_intent, p_gross, p_fee, p_platform_fee)
  returning id into v_pay;

  perform ledger_post_order_paid(p_order, p_fee, p_platform_fee);
  return v_pay;
end $$;

-- record_refund — mirror + ledger, idempotent on stripe_refund_id.
create or replace function record_refund(
  p_order     uuid,
  p_amount    bigint,
  p_reason    text default null,
  p_refund_id text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_ref uuid;
begin
  select org_id into v_org from "order" where id = p_order for update;
  if v_org is null then raise exception 'order % not found', p_order; end if;

  if p_refund_id is not null and exists (select 1 from refund where stripe_refund_id = p_refund_id) then
    select id into v_ref from refund where stripe_refund_id = p_refund_id;
    return v_ref;
  end if;

  insert into refund (org_id, order_id, stripe_refund_id, amount_cents, reason)
  values (v_org, p_order, p_refund_id, p_amount, p_reason)
  returning id into v_ref;

  perform ledger_post_refund(p_order, p_amount);
  return v_ref;
end $$;
