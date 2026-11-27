\set ON_ERROR_STOP on

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create schema private;

create type public.product_status as enum ('draft', 'pending', 'active', 'rejected', 'archived');
create type public.shop_status as enum ('draft', 'pending', 'active', 'suspended', 'closed');
create type public.audit_action as enum ('create', 'update', 'delete', 'approve', 'reject');

create table public.shops (
  id uuid primary key,
  status public.shop_status not null
);

create table public.products (
  id uuid primary key,
  shop_id uuid not null references public.shops(id),
  status public.product_status not null,
  is_featured boolean not null default false
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

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$;

create or replace function public.current_user_has_permission(p_permission_key text)
returns boolean
language sql
stable
as $$
  select current_setting('test.permission', true) = p_permission_key;
$$;

create or replace function private.guard_product_writes()
returns trigger
language plpgsql
as $$
begin
  return new;
end;
$$;

create trigger guard_product_writes
before insert or update on public.products
for each row execute function private.guard_product_writes();

grant usage on schema public, auth to anon, authenticated, service_role;
grant usage on type public.product_status, public.shop_status, public.audit_action to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.jwt(), public.current_user_has_permission(text) to anon, authenticated, service_role;
grant select, insert, update on public.products to authenticated;
grant select on public.shops to authenticated;
grant select on public.admin_actions, public.audit_logs to authenticated;
