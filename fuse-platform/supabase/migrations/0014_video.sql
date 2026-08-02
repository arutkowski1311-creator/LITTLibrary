-- ============================================================================
-- Fuse Platform — Migration 0014: Video library (reference model)
--
-- The org stores video *metadata + an external link* (YouTube unlisted, Hudl,
-- Vimeo, Drive) — it never hosts minors' raw footage. Assets are bucketed and
-- permissioned by visibility. Designed so native uploads can slot in later
-- behind the same table (add a storage_key/playback column; the UI is unchanged).
--
-- Visibility tiers:
--   org      → any org member
--   coaches  → org_owner / org_admin / team_manager only
--   private  → the uploader or the tagged player only
-- ============================================================================

create type video_bucket     as enum ('game','practice','interview','skills','highlight','other');
create type video_visibility as enum ('org','coaches','private');

create table video_asset (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organization(id) on delete cascade,
  player_id     uuid references app_user(id) on delete set null,
  team_id       uuid references team(id) on delete set null,
  bucket        video_bucket not null default 'other',
  title         text not null,
  url           text not null,                 -- external link; playback stays on the host
  provider      text,                          -- youtube | vimeo | hudl | drive | link
  thumbnail_url text,
  visibility    video_visibility not null default 'org',
  created_by    uuid references app_user(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index on video_asset (org_id, bucket);
create index on video_asset (player_id);

alter table video_asset enable row level security;

-- SELECT is the only place visibility tiers apply — keep it a lone SELECT policy
-- (no broad FOR ALL policy, which would re-open reads to every member).
create policy video_read on video_asset for select using (
  is_platform_admin() or (
    is_org_member(org_id) and (
      visibility = 'org'
      or (visibility = 'coaches' and exists (
            select 1 from membership m
            where m.org_id = video_asset.org_id and m.user_id = auth.uid()
              and m.role in ('org_owner','org_admin','team_manager')))
      or (visibility = 'private' and (created_by = auth.uid() or player_id = auth.uid()))
    )
  )
);
create policy video_insert on video_asset for insert with check (is_org_member(org_id) or is_platform_admin());
create policy video_update on video_asset for update using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());
create policy video_delete on video_asset for delete using (is_org_member(org_id) or is_platform_admin());
