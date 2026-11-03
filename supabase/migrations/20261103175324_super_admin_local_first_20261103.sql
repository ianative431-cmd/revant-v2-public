-- Private identity mapping and per-browser device registry for Revant Super Admin.
-- Only server code using the Supabase service role may access these tables.
create table if not exists public.super_admin_identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (char_length(btrim(first_name)) between 2 and 60),
  last_name text not null check (char_length(btrim(last_name)) between 2 and 60),
  first_name_normalized text not null,
  last_name_normalized text not null,
  access_key_salt text not null check (char_length(access_key_salt) >= 32),
  access_key_digest text not null check (char_length(access_key_digest) = 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists super_admin_identities_name_idx on public.super_admin_identities (first_name_normalized, last_name_normalized);
alter table public.super_admin_identities enable row level security;
revoke all on table public.super_admin_identities from public, anon, authenticated;
grant select, insert, update, delete on table public.super_admin_identities to service_role;

create table if not exists public.super_admin_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null check (char_length(btrim(device_name)) between 2 and 80),
  device_token_digest text not null unique check (char_length(device_token_digest) = 64),
  status text not null default 'pending' check (status in ('pending', 'approved', 'revoked')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  approved_at timestamptz,
  revoked_at timestamptz
);
create index if not exists super_admin_devices_user_status_idx on public.super_admin_devices (user_id, status, created_at desc);
alter table public.super_admin_devices enable row level security;
revoke all on table public.super_admin_devices from public, anon, authenticated;
grant select, insert, update, delete on table public.super_admin_devices to service_role;
