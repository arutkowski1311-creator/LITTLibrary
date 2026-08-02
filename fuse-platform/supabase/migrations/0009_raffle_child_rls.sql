-- ============================================================================
-- Fuse Platform — Migration 0009: RLS on raffle child tables
--
-- 0004 enabled RLS on `raffle` and `raffle_entry` but left the child tables
-- (prizes, rule versions, acknowledgments, draws, winners) open. Now that the
-- app writes these directly during campaign creation, scope them to the parent
-- raffle's org. SECURITY DEFINER functions (raffle_run_draw) run as owner and
-- bypass RLS, so draws still work.
-- ============================================================================

alter table raffle_prize          enable row level security;
alter table raffle_rule_version   enable row level security;
alter table raffle_acknowledgment enable row level security;
alter table raffle_draw           enable row level security;
alter table raffle_winner         enable row level security;

-- Tables that carry raffle_id directly.
create policy raffle_prize_rw on raffle_prize using (
  exists (select 1 from raffle r where r.id = raffle_prize.raffle_id and (is_org_member(r.org_id) or is_platform_admin()))
) with check (
  exists (select 1 from raffle r where r.id = raffle_prize.raffle_id and (is_org_member(r.org_id) or is_platform_admin()))
);

create policy raffle_rule_rw on raffle_rule_version using (
  exists (select 1 from raffle r where r.id = raffle_rule_version.raffle_id and (is_org_member(r.org_id) or is_platform_admin()))
) with check (
  exists (select 1 from raffle r where r.id = raffle_rule_version.raffle_id and (is_org_member(r.org_id) or is_platform_admin()))
);

create policy raffle_ack_rw on raffle_acknowledgment using (
  exists (select 1 from raffle r where r.id = raffle_acknowledgment.raffle_id and (is_org_member(r.org_id) or is_platform_admin()))
) with check (
  exists (select 1 from raffle r where r.id = raffle_acknowledgment.raffle_id and (is_org_member(r.org_id) or is_platform_admin()))
);

create policy raffle_draw_rw on raffle_draw using (
  exists (select 1 from raffle r where r.id = raffle_draw.raffle_id and (is_org_member(r.org_id) or is_platform_admin()))
) with check (
  exists (select 1 from raffle r where r.id = raffle_draw.raffle_id and (is_org_member(r.org_id) or is_platform_admin()))
);

-- Winners scope through their draw to the raffle.
create policy raffle_winner_rw on raffle_winner using (
  exists (
    select 1 from raffle_draw d join raffle r on r.id = d.raffle_id
    where d.id = raffle_winner.draw_id and (is_org_member(r.org_id) or is_platform_admin())
  )
) with check (
  exists (
    select 1 from raffle_draw d join raffle r on r.id = d.raffle_id
    where d.id = raffle_winner.draw_id and (is_org_member(r.org_id) or is_platform_admin())
  )
);
