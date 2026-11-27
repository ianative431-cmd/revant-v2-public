-- Secure one-time bootstrap and resumable Super Admin key rotation.
create table if not exists public.super_admin_bootstrap_claims (
  id smallint primary key default 1 check (id = 1),
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.super_admin_bootstrap_claims enable row level security;
revoke all on table public.super_admin_bootstrap_claims from public, anon, authenticated;
grant select, insert, update, delete on table public.super_admin_bootstrap_claims to service_role;

create table if not exists public.super_admin_bootstrap_pending (
  user_id uuid primary key references auth.users(id) on delete cascade,
  operation_id uuid not null unique,
  first_name text not null check (char_length(btrim(first_name)) between 2 and 60),
  first_name_normalized text not null,
  access_key_salt text not null check (char_length(access_key_salt) >= 32),
  access_key_digest text not null check (char_length(access_key_digest) = 64),
  device_name text not null check (char_length(btrim(device_name)) between 2 and 80),
  device_token_digest text not null unique check (char_length(device_token_digest) = 64),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.super_admin_bootstrap_pending enable row level security;
revoke all on table public.super_admin_bootstrap_pending from public, anon, authenticated;
grant select, insert, update, delete on table public.super_admin_bootstrap_pending to service_role;

create table if not exists public.super_admin_key_rotation_pending (
  user_id uuid primary key references auth.users(id) on delete cascade,
  operation_id uuid not null unique,
  access_key_salt text not null check (char_length(access_key_salt) >= 32),
  access_key_digest text not null check (char_length(access_key_digest) = 64),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.super_admin_key_rotation_pending enable row level security;
revoke all on table public.super_admin_key_rotation_pending from public, anon, authenticated;
grant select, insert, update, delete on table public.super_admin_key_rotation_pending to service_role;

create or replace function public.claim_super_admin_bootstrap(
  p_user_id uuid, p_expires_at timestamptz
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare affected integer;
begin
  if p_expires_at <= now() or p_expires_at > now() + interval '30 minutes' then return false; end if;
  insert into public.super_admin_bootstrap_claims(id, user_id, expires_at)
  values (1, p_user_id, p_expires_at)
  on conflict (id) do update
    set user_id = excluded.user_id, claimed_at = now(), expires_at = excluded.expires_at
    where public.super_admin_bootstrap_claims.expires_at <= now()
       or public.super_admin_bootstrap_claims.user_id = excluded.user_id;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.release_super_admin_bootstrap(p_user_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare affected integer;
begin
  delete from public.super_admin_bootstrap_claims where id = 1 and user_id = p_user_id;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.begin_super_admin_bootstrap(
  p_user_id uuid,
  p_operation_id uuid,
  p_first_name text,
  p_first_name_normalized text,
  p_access_key_salt text,
  p_access_key_digest text,
  p_device_name text,
  p_device_token_digest text,
  p_expires_at timestamptz
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare affected integer;
begin
  if p_first_name is null or char_length(btrim(p_first_name)) < 2 or char_length(btrim(p_first_name)) > 60
     or p_first_name_normalized is null or char_length(p_first_name_normalized) < 2
     or p_access_key_salt is null or char_length(p_access_key_salt) < 32
     or p_access_key_digest is null or p_access_key_digest !~ '^[a-f0-9]{64}$'
     or p_device_name is null or char_length(btrim(p_device_name)) < 2 or char_length(btrim(p_device_name)) > 80
     or p_device_token_digest is null or p_device_token_digest !~ '^[a-f0-9]{64}$'
     or p_expires_at <= now() or p_expires_at > now() + interval '20 minutes' then
    return false;
  end if;

  perform 1 from public.super_admin_bootstrap_claims
   where id = 1 and user_id = p_user_id and expires_at > now();
  if not found or exists (select 1 from public.super_admin_identities) then return false; end if;

  insert into public.super_admin_bootstrap_pending (
    user_id, operation_id, first_name, first_name_normalized,
    access_key_salt, access_key_digest, device_name, device_token_digest, expires_at
  ) values (
    p_user_id, p_operation_id, btrim(p_first_name), p_first_name_normalized,
    p_access_key_salt, p_access_key_digest, btrim(p_device_name), p_device_token_digest, p_expires_at
  )
  on conflict (user_id) do update
    set operation_id = excluded.operation_id,
        first_name = excluded.first_name,
        first_name_normalized = excluded.first_name_normalized,
        access_key_salt = excluded.access_key_salt,
        access_key_digest = excluded.access_key_digest,
        device_name = excluded.device_name,
        device_token_digest = excluded.device_token_digest,
        created_at = now(),
        expires_at = excluded.expires_at
    where public.super_admin_bootstrap_pending.expires_at <= now();

  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.finalize_super_admin_bootstrap(
  p_user_id uuid, p_operation_id uuid
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  pending_first_name text;
  pending_first_name_normalized text;
  pending_salt text;
  pending_digest text;
  pending_device_name text;
  pending_device_token_digest text;
  created_device_id uuid;
begin
  select first_name, first_name_normalized, access_key_salt, access_key_digest,
         device_name, device_token_digest
    into pending_first_name, pending_first_name_normalized, pending_salt, pending_digest,
         pending_device_name, pending_device_token_digest
    from public.super_admin_bootstrap_pending
   where user_id = p_user_id and operation_id = p_operation_id and expires_at > now()
   for update;
  if not found then return null; end if;

  perform 1 from public.super_admin_bootstrap_claims
   where id = 1 and user_id = p_user_id and expires_at > now()
   for update;
  if not found then return null; end if;

  if exists (select 1 from public.super_admin_identities) then return null; end if;

  insert into public.super_admin_identities (
    user_id, first_name, last_name, first_name_normalized, last_name_normalized,
    access_key_salt, access_key_digest
  ) values (
    p_user_id, pending_first_name, 'Super Admin', pending_first_name_normalized, 'super admin',
    pending_salt, pending_digest
  );

  insert into public.super_admin_devices (
    user_id, device_name, device_token_digest, status, approved_at, last_seen_at
  ) values (
    p_user_id, pending_device_name, pending_device_token_digest, 'approved', now(), now()
  ) returning id into created_device_id;

  delete from public.super_admin_bootstrap_pending
   where user_id = p_user_id and operation_id = p_operation_id;
  delete from public.super_admin_bootstrap_claims where id = 1 and user_id = p_user_id;
  return created_device_id;
end;
$$;

create or replace function public.begin_super_admin_key_rotation(
  p_user_id uuid, p_operation_id uuid, p_access_key_salt text,
  p_access_key_digest text, p_expires_at timestamptz
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare affected integer;
begin
  if p_access_key_salt is null or char_length(p_access_key_salt) < 32
     or p_access_key_digest is null or p_access_key_digest !~ '^[a-f0-9]{64}$'
     or p_expires_at <= now()
     or p_expires_at > now() + interval '20 minutes' then return false; end if;
  insert into public.super_admin_key_rotation_pending
    (user_id, operation_id, access_key_salt, access_key_digest, expires_at)
  values (p_user_id, p_operation_id, p_access_key_salt, p_access_key_digest, p_expires_at)
  on conflict (user_id) do update
    set operation_id = excluded.operation_id,
        access_key_salt = excluded.access_key_salt,
        access_key_digest = excluded.access_key_digest,
        created_at = now(), expires_at = excluded.expires_at
    where public.super_admin_key_rotation_pending.expires_at <= now()
       or public.super_admin_key_rotation_pending.access_key_digest = excluded.access_key_digest;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.finalize_super_admin_key_rotation(
  p_user_id uuid, p_operation_id uuid
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare pending_salt text; pending_digest text;
begin
  select access_key_salt, access_key_digest into pending_salt, pending_digest
  from public.super_admin_key_rotation_pending
  where user_id = p_user_id and operation_id = p_operation_id and expires_at > now()
  for update;
  if not found then return false; end if;
  update public.super_admin_identities
    set access_key_salt = pending_salt, access_key_digest = pending_digest, updated_at = now()
  where user_id = p_user_id;
  if not found then return false; end if;
  delete from public.super_admin_key_rotation_pending
  where user_id = p_user_id and operation_id = p_operation_id;
  return true;
end;
$$;

revoke all on function public.claim_super_admin_bootstrap(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.release_super_admin_bootstrap(uuid) from public, anon, authenticated;
revoke all on function public.begin_super_admin_bootstrap(uuid, uuid, text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.finalize_super_admin_bootstrap(uuid, uuid) from public, anon, authenticated;
revoke all on function public.begin_super_admin_key_rotation(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.finalize_super_admin_key_rotation(uuid, uuid) from public, anon, authenticated;

grant execute on function public.claim_super_admin_bootstrap(uuid, timestamptz) to service_role;
grant execute on function public.release_super_admin_bootstrap(uuid) to service_role;
grant execute on function public.begin_super_admin_bootstrap(uuid, uuid, text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.finalize_super_admin_bootstrap(uuid, uuid) to service_role;
grant execute on function public.begin_super_admin_key_rotation(uuid, uuid, text, text, timestamptz) to service_role;
grant execute on function public.finalize_super_admin_key_rotation(uuid, uuid) to service_role;
