\set ON_ERROR_STOP on

create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema auth;
create schema private;

create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create function auth.jwt() returns jsonb
language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;

create table public.user_roles (
  user_id uuid not null,
  role text not null,
  primary key (user_id, role)
);

create table public.permissions (
  id uuid primary key,
  key text not null unique
);

create table public.role_permissions (
  role text not null,
  permission_id uuid not null references public.permissions(id),
  primary key (role, permission_id)
);

create table public.super_admin_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  device_name text not null,
  device_token_digest text not null,
  status text not null check (status in ('pending','approved','revoked')),
  approved_at timestamptz,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  action text not null,
  target_type text,
  target_id uuid,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create type public.audit_action as enum ('update');

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action public.audit_action not null,
  entity_type text not null,
  entity_id uuid,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create function public.has_any_admin_role() returns boolean
language sql stable as $$ select false $$;

create function public.current_user_has_permission(p_permission_key text) returns boolean
language sql stable as $$ select false $$;

grant usage on schema auth to authenticated, service_role;
grant execute on function auth.uid() to authenticated, service_role;
grant execute on function auth.jwt() to authenticated, service_role;
grant select on public.user_roles, public.permissions, public.role_permissions to authenticated;
grant usage on schema private to authenticated, service_role;
