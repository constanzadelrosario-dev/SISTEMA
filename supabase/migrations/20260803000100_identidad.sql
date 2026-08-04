-- 01 · Identidad, workspaces y política RLS base.

create extension if not exists "pgcrypto";

create table workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  created_at  timestamptz not null default now()
);

create type member_role as enum ('owner', 'editor', 'viewer');

create table memberships (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         member_role not null default 'owner',
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Toda política RLS del sistema se apoya en esta función.
create or replace function is_member(ws uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

alter table workspaces  enable row level security;
alter table profiles    enable row level security;
alter table memberships enable row level security;

create policy workspaces_member on workspaces
  for all to authenticated using (is_member(id)) with check (is_member(id));

create policy profiles_own on profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy memberships_member on memberships
  for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));

-- Utilidad reusada por casi todas las tablas.
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
