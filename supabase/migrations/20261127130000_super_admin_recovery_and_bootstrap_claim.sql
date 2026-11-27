-- Secure one-time bootstrap and resumable Super Admin key rotation.
create table if not exists public.super_admin_bootstrap_claims (
  id smallint primary key default 1 check (id = 1),
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now()
);
alter table public.super_admin_bootstrap_claims enable row level security;
revoke all on table public.super_admin_bootstrap_claims from public, anon, authenticated;
grant select, insert on table public.super_admin_bootstrap_claims to service_role;

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

create or replace function public.begin_super_admin_key_rotation(
  p_user_id uuid, p_operation_id uuid, p_access_key_salt text,
  p_access_key_digest text, p_expires_at timestamptz
) returns boolean language plpgsql security definer set search_path = '' as $$
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
    where public.super_admin_key_rotation_pending.expires_at <= now();
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.finalize_super_admin_key_rotation(
  p_user_id uuid, p_operation_id uuid
) returns boolean language plpgsql security definer set search_path = '' as $$
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

revoke all on function public.begin_super_admin_key_rotation(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.finalize_super_admin_key_rotation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.begin_super_admin_key_rotation(uuid, uuid, text, text, timestamptz) to service_role;
grant execute on function public.finalize_super_admin_key_rotation(uuid, uuid) to service_role;
