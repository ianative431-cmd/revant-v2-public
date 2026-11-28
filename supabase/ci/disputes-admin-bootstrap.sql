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

create type public.order_status as enum (
  'pending','confirmed','processing','ready_for_delivery','shipped','delivered','cancelled','refunded','disputed'
);
create type public.dispute_status as enum (
  'open','under_review','resolved_buyer','resolved_seller','rejected','closed'
);
create type public.notification_type as enum (
  'order','payment','payout','message','promotion','system','security','delivery'
);
create type public.audit_action as enum ('approve','reject','update');

create table public.profiles(id uuid primary key, display_name text);
create table public.permissions(id uuid primary key, key text not null unique);
create table public.user_roles(user_id uuid not null, role text not null, primary key(user_id,role));
create table public.role_permissions(role text not null, permission_id uuid not null references public.permissions(id), primary key(role,permission_id));

create table public.orders(
  id uuid primary key,
  buyer_id uuid references public.profiles(id),
  status public.order_status not null
);
create table public.shops(
  id uuid primary key,
  owner_id uuid not null references public.profiles(id)
);
create table public.order_items(
  id uuid primary key,
  order_id uuid not null references public.orders(id),
  shop_id uuid not null references public.shops(id)
);

create table public.disputes(
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  opened_by uuid not null references public.profiles(id),
  reason text not null,
  description text,
  status public.dispute_status not null default 'open',
  assigned_to uuid references public.profiles(id),
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_actions(
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  action text not null,
  target_type text,
  target_id uuid,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_logs(
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action public.audit_action not null,
  entity_type text not null,
  entity_id uuid,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table public.notifications(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type public.notification_type not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create function private.is_order_buyer(p_order_id uuid)
returns boolean language sql stable security definer set search_path to ''
as $$ select exists(select 1 from public.orders o where o.id=p_order_id and o.buyer_id=(select auth.uid())) $$;

create function private.is_order_seller(p_order_id uuid)
returns boolean language sql stable security definer set search_path to ''
as $$ select exists(select 1 from public.order_items oi join public.shops s on s.id=oi.shop_id where oi.order_id=p_order_id and s.owner_id=(select auth.uid())) $$;

create function public.current_user_has_permission(p_permission_key text)
returns boolean language sql stable security invoker set search_path to ''
as $$
  select exists(
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role=ur.role
    join public.permissions p on p.id=rp.permission_id
    where ur.user_id=(select auth.uid()) and p.key=p_permission_key
  )
$$;

create function public.has_any_admin_role()
returns boolean language sql stable security invoker set search_path to ''
as $$
  select exists(
    select 1 from public.user_roles ur
    where ur.user_id=(select auth.uid()) and ur.role in ('super_admin','admin','moderator','support_admin','finance_admin','kyc_admin','catalog_admin')
  )
$$;

alter table public.disputes enable row level security;
create policy "order participants can create disputes" on public.disputes
  for insert to authenticated with check (
    opened_by=(select auth.uid())
    and status='open'::public.dispute_status
    and assigned_to is null
    and resolved_at is null
    and resolution_note is null
    and (private.is_order_buyer(order_id) or private.is_order_seller(order_id))
  );
create policy "users view disputes they opened" on public.disputes
  for select to authenticated using (opened_by=(select auth.uid()));

grant usage on schema auth, private to authenticated, service_role;
grant execute on function auth.uid() to authenticated, service_role;
grant execute on function auth.jwt() to authenticated, service_role;
grant execute on function private.is_order_buyer(uuid) to authenticated, service_role;
grant execute on function private.is_order_seller(uuid) to authenticated, service_role;
grant select on public.profiles, public.permissions, public.user_roles, public.role_permissions, public.orders, public.order_items, public.shops, public.disputes to authenticated;
grant insert on public.disputes to authenticated;
