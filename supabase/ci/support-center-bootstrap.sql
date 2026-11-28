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

create table public.profiles(id uuid primary key);

create type public.notification_type as enum ('order','payment','payout','message','promotion','system','security','delivery');
create table public.notifications(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "users manage own notifications" on public.notifications
  for select to authenticated using (user_id=(select auth.uid()));


create table public.user_roles(user_id uuid not null, role text not null, primary key(user_id,role));
create table public.permissions(id uuid primary key, key text not null unique);
create table public.role_permissions(role text not null, permission_id uuid not null references public.permissions(id), primary key(role,permission_id));

create function public.current_user_has_permission(p_permission_key text)
returns boolean language sql stable security invoker
set search_path to ''
as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role=ur.role
    join public.permissions p on p.id=rp.permission_id
    where ur.user_id=(select auth.uid()) and p.key=p_permission_key
  );
$$;

create table public.support_tickets(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  subject text not null,
  description text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_messages(
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

create policy "users view own tickets" on public.support_tickets
  for select to authenticated using (user_id=(select auth.uid()));
create policy "users create own tickets" on public.support_tickets
  for insert to authenticated with check (user_id=(select auth.uid()));

create policy "ticket participants view messages" on public.support_messages
  for select to authenticated using (
    exists(select 1 from public.support_tickets t
      where t.id=support_messages.ticket_id
        and (t.user_id=(select auth.uid()) or t.assigned_to=(select auth.uid())))
  );
create policy "ticket users send messages" on public.support_messages
  for insert to authenticated with check (
    sender_id=(select auth.uid()) and exists(
      select 1 from public.support_tickets t
      where t.id=support_messages.ticket_id
        and (t.user_id=(select auth.uid()) or t.assigned_to=(select auth.uid()))
    )
  );

grant usage on schema auth, private to authenticated, service_role;
grant execute on function auth.uid() to authenticated, service_role;
grant execute on function auth.jwt() to authenticated, service_role;
grant select on public.user_roles, public.role_permissions, public.permissions, public.notifications to authenticated;
grant select,insert on public.support_tickets,public.support_messages to authenticated;
grant select on public.support_tickets,public.support_messages to service_role;
