\set ON_ERROR_STOP on

create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema private;

create type public.audit_action as enum ('create','update','delete');
create type public.report_status as enum ('open','reviewing','resolved','dismissed');

create table public.profiles (
  id uuid primary key
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  description text,
  status public.report_status not null default 'open',
  assigned_to uuid,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

grant usage on schema private to authenticated, service_role;
grant select, insert, update on public.reports to authenticated;
grant select, insert on public.audit_logs to authenticated;
