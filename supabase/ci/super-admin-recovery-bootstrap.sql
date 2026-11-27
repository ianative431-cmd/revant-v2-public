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
  access_key_salt text not null,
  access_key_digest text not null,
  updated_at timestamptz not null default now()
);
