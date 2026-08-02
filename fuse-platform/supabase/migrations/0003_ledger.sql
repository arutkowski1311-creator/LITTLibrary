-- ============================================================================
-- Fuse Platform — Migration 0003: Ledger posting + golf settlement workflow
--
-- Accounting convention (single, enforced everywhere):
--   Every posting creates one txn_group whose credits equal its debits.
--   For the ORG party, a DEBIT means cash IN and a CREDIT means cash OUT
--   (org is an asset account: debit increases it). So:
--     org cash balance  = sum(org debit)  - sum(org credit)
--     net proceeds      = sum(fund credit) - sum(fund debit)
--
-- Every posting function asserts balance before returning and raises if the
-- group is off by a single cent. This is the guarantee the whole product leans
-- on: the ledger cannot be left inconsistent.
-- ============================================================================

-- Shared assertion: a txn_group's credits must equal its debits.
create or replace function assert_txn_balanced(p_group uuid)
returns void language plpgsql as $$
declare v_credit bigint; v_debit bigint;
begin
  select coalesce(sum(amount_cents) filter (where direction = 'credit'), 0),
         coalesce(sum(amount_cents) filter (where direction = 'debit'),  0)
    into v_credit, v_debit
  from ledger_entry where txn_group = p_group;

  if v_credit <> v_debit then
    raise exception 'ledger txn_group % unbalanced: credit=% debit=%',
      p_group, v_credit, v_debit;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Order paid: fan the gross into net proceeds + processor fee + platform fee.
--   gross (org debit) = net (fund credit) + payment_fee (credit) + platform (credit)
-- ---------------------------------------------------------------------------
create or replace function ledger_post_order_paid(
  p_order        uuid,
  p_payment_fee  bigint default 0,
  p_platform_fee bigint default 0
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_org   uuid;
  v_gross bigint;
  v_net   bigint;
  v_grp   uuid := gen_random_uuid();
begin
  select org_id, total_cents into v_org, v_gross
  from "order" where id = p_order for update;

  if v_org is null then raise exception 'order % not found', p_order; end if;
  if p_payment_fee < 0 or p_platform_fee < 0 then
    raise exception 'fees must be non-negative';
  end if;

  v_net := v_gross - p_payment_fee - p_platform_fee;
  if v_net < 0 then raise exception 'fees exceed gross for order %', p_order; end if;

  insert into ledger_entry (org_id, txn_group, order_id, party, direction, amount_cents, memo) values
    (v_org, v_grp, p_order, 'org',         'debit',  v_gross,        'gross received'),
    (v_org, v_grp, p_order, 'fund',        'credit', v_net,          'net proceeds'),
    (v_org, v_grp, p_order, 'payment_fee', 'credit', p_payment_fee,  'processor fee'),
    (v_org, v_grp, p_order, 'platform',    'credit', p_platform_fee, 'facilitation fee');

  perform assert_txn_balanced(v_grp);
  update "order" set status = 'paid' where id = p_order;
  return v_grp;
end $$;

-- ---------------------------------------------------------------------------
-- Refund: cash leaves the org, net proceeds reduced. Partial or full.
-- ---------------------------------------------------------------------------
create or replace function ledger_post_refund(
  p_order  uuid,
  p_amount bigint
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_org   uuid;
  v_total bigint;
  v_grp   uuid := gen_random_uuid();
begin
  select org_id, total_cents into v_org, v_total
  from "order" where id = p_order for update;

  if v_org is null then raise exception 'order % not found', p_order; end if;
  if p_amount <= 0 then raise exception 'refund amount must be positive'; end if;
  if p_amount > v_total then raise exception 'refund exceeds order total'; end if;

  insert into ledger_entry (org_id, txn_group, order_id, party, direction, amount_cents, memo) values
    (v_org, v_grp, p_order, 'org',    'credit', p_amount, 'refund cash out'),
    (v_org, v_grp, p_order, 'refund', 'debit',  p_amount, 'refund');

  perform assert_txn_balanced(v_grp);
  update "order"
    set status = (case when p_amount >= v_total then 'refunded' else 'partially_refunded' end)::order_status
    where id = p_order;
  return v_grp;
end $$;

-- ---------------------------------------------------------------------------
-- Partner settlement: org pays a partner (e.g. the golf course) from proceeds.
-- p_order may be null (settlement isn't tied to a single order).
-- ---------------------------------------------------------------------------
create or replace function ledger_post_partner_settlement(
  p_org    uuid,
  p_amount bigint,
  p_order  uuid default null,
  p_memo   text default 'partner settlement'
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_grp uuid := gen_random_uuid();
begin
  if p_amount <= 0 then raise exception 'settlement amount must be positive'; end if;

  insert into ledger_entry (org_id, txn_group, order_id, party, direction, amount_cents, memo) values
    (p_org, v_grp, p_order, 'org',     'credit', p_amount, 'cash to partner'),
    (p_org, v_grp, p_order, 'partner', 'debit',  p_amount, p_memo);

  perform assert_txn_balanced(v_grp);
  return v_grp;
end $$;

-- ---------------------------------------------------------------------------
-- Reporting: one row per org, the gross-to-net waterfall the dashboard needs.
-- security_invoker so the caller's RLS applies to the underlying ledger.
-- ---------------------------------------------------------------------------
create view org_ledger_summary with (security_invoker = true) as
select
  org_id,
  coalesce(sum(amount_cents) filter (where party = 'org'  and direction = 'debit'),  0)
    - coalesce(sum(amount_cents) filter (where party = 'org'  and direction = 'credit'), 0) as org_cash_cents,
  coalesce(sum(amount_cents) filter (where party = 'fund' and direction = 'credit'), 0)
    - coalesce(sum(amount_cents) filter (where party = 'fund' and direction = 'debit'),  0) as net_proceeds_cents,
  coalesce(sum(amount_cents) filter (where party = 'platform'    and direction = 'credit'), 0) as platform_fees_cents,
  coalesce(sum(amount_cents) filter (where party = 'payment_fee' and direction = 'credit'), 0) as processor_fees_cents,
  coalesce(sum(amount_cents) filter (where party = 'partner'     and direction = 'debit'),  0) as partner_paid_cents,
  coalesce(sum(amount_cents) filter (where party = 'refund'      and direction = 'debit'),  0) as refunds_cents
from ledger_entry
group by org_id;

-- ============================================================================
-- Golf commercial workflow — the state transitions behind "one reconciled
-- outing." Each writes an immutable audit_log entry.
-- ============================================================================

-- 21-day binding go/no-go decision.
create or replace function golf_set_go_no_go(p_outing uuid, p_decision go_no_go)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_prior go_no_go;
begin
  select org_id, go_no_go_decision into v_org, v_prior
  from golf_outing where id = p_outing for update;
  if v_org is null then raise exception 'outing % not found', p_outing; end if;
  if not is_org_member(v_org) and not is_platform_admin() then
    raise exception 'not authorized';
  end if;

  update golf_outing
    set go_no_go_decision = p_decision, go_no_go_at = now()
    where id = p_outing;

  insert into audit_log (org_id, actor_user, action, object_type, object_id, prior_state, new_state)
  values (v_org, auth.uid(), 'golf.go_no_go', 'golf_outing', p_outing,
          jsonb_build_object('decision', v_prior),
          jsonb_build_object('decision', p_decision));
end $$;

-- Lock the guaranteed golfer/meal count at the contractual cutoff.
create or replace function golf_lock_count(p_outing uuid, p_count int)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from golf_outing where id = p_outing for update;
  if v_org is null then raise exception 'outing % not found', p_outing; end if;
  if not is_org_member(v_org) and not is_platform_admin() then
    raise exception 'not authorized';
  end if;
  if p_count < 0 then raise exception 'count must be non-negative'; end if;

  update golf_outing
    set guaranteed_count = p_count, count_locked_at = now()
    where id = p_outing;

  insert into audit_log (org_id, actor_user, action, object_type, object_id, new_state)
  values (v_org, auth.uid(), 'golf.lock_count', 'golf_outing', p_outing,
          jsonb_build_object('guaranteed_count', p_count));
end $$;
