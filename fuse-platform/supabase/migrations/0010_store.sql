-- ============================================================================
-- Fuse Platform — Migration 0010: co-member visibility (for rosters/store)
--
-- app_user is self-read-only by default (0002). The team store's player
-- attribution and credit leaderboard need org members to see co-members' names.
-- This adds a SELECT policy: you may read an app_user row if you share an org
-- with that user. Permissive, so it ORs with the existing self policy.
-- ============================================================================

create policy app_user_comember_read on app_user for select using (
  exists (
    select 1
    from membership m1
    join membership m2 on m1.org_id = m2.org_id
    where m1.user_id = auth.uid()
      and m2.user_id = app_user.id
  )
);
