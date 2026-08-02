-- ============================================================================
-- Dev-only application role. RLS is ENFORCED for this role (it is not the table
-- owner and has no BYPASSRLS), so local development exercises the same
-- row-level isolation that Supabase's `authenticated` role does in prod.
-- The app connects as fuse_app and runs `set local app.uid = '<user>'` per
-- request; SECURITY DEFINER functions (owned by the migration role) still run
-- with their definer's rights, exactly as on Supabase.
-- ============================================================================
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'fuse_app') then
    create role fuse_app login password 'fuse_app';
  end if;
end $$;

grant usage on schema public to fuse_app;
grant usage on schema auth   to fuse_app;
grant select on auth.users   to fuse_app;
grant select, insert, update, delete on all tables    in schema public to fuse_app;
grant usage, select                  on all sequences in schema public to fuse_app;
grant execute                        on all functions in schema public to fuse_app;

alter default privileges in schema public grant select, insert, update, delete on tables to fuse_app;
alter default privileges in schema public grant execute on functions to fuse_app;
