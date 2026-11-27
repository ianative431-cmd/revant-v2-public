\set ON_ERROR_STOP on

create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema auth;

create table auth.users (
  id uuid primary key,
  email text unique
);

create table public.super_admin_identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  first_name_normalized text not null,
  last_name_normalized text not null,
  access_key_salt text not null,
  access_key_digest text not null,
  updated_at timestamptz not null default now()
);

create table public.super_admin_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null,
  device_token_digest text not null,
  status text not null check (status in ('pending','approved','revoked')),
  approved_at timestamptz,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
