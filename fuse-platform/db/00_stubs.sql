-- ============================================================================
-- LOCAL-DEV ONLY. On Supabase these objects already exist (Supabase Auth owns
-- them). For a plain local Postgres (docker-compose) we stub the two Supabase
-- surfaces the migrations reference: the auth.users table and auth.uid().
-- auth.uid() reads the per-request GUC `app.uid` that lib/db.ts sets.
-- Do NOT run this against a real Supabase database.
-- ============================================================================
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid()
);

create or replace function auth.uid()
returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('app.uid', true), '')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid   -- anonymous sentinel
  );
$$;
