-- Minimal Supabase scaffolding so 0007_billing.sql can be applied against a
-- plain Postgres instance (no full Supabase stack needed). Mirrors only what
-- the billing migration actually depends on:
--   * auth.users(id)         — FK target for subscriptions / top-ups
--   * auth.uid()             — referenced by the RLS policies
--   * update_updated_at()    — trigger fn (defined in 0001 in the real DB)
--   * roles public/authenticated — grant/revoke targets
-- Keep this in sync with those external dependencies, not the whole schema.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- RLS-only helper. Tests exercise SECURITY DEFINER RPCs (which bypass RLS),
-- so a stub returning NULL is sufficient for the policies to be creatable.
create or replace function auth.uid() returns uuid
  language sql stable as $$ select null::uuid $$;

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
end $$;
