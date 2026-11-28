-- Bind the Super Admin trusted-device approval to the current Supabase Auth session.
-- This closes direct-RPC paths that previously checked AAL2 but could not verify
-- that the caller's session belonged to an approved device.
alter table public.super_admin_devices
  add column if not exists session_id uuid;

create unique index if not exists super_admin_devices_approved_session_uidx
  on public.super_admin_devices(session_id)
  where session_id is not null and status = 'approved';

create index if not exists super_admin_devices_user_status_session_idx
  on public.super_admin_devices(user_id, status, session_id);

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_current_super_admin_device_trusted()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select
    (select auth.uid()) is not null
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
      select 1
      from public.super_admin_devices d
      where d.user_id = (select auth.uid())
        and d.status = 'approved'
        and d.session_id::text = (select auth.jwt() ->> 'session_id')
    );
$function$;

revoke all on function private.is_current_super_admin_device_trusted() from public, anon;
grant execute on function private.is_current_super_admin_device_trusted() to authenticated, service_role;

create or replace function public.has_any_admin_role()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('super_admin','admin','moderator','finance_admin','support_admin','kyc_admin','catalog_admin')
    )
    and (
      not exists (
        select 1
        from public.user_roles ur
        where ur.user_id = (select auth.uid())
          and ur.role = 'super_admin'
      )
      or private.is_current_super_admin_device_trusted()
    );
$function$;

revoke all on function public.has_any_admin_role() from public, anon;
grant execute on function public.has_any_admin_role() to authenticated, service_role;

-- Keep associate permissions working while enforcing both AAL2 and an approved
-- device-bound session whenever the caller has the Super Admin role.
create or replace function public.current_user_has_permission(p_permission_key text)
returns boolean
language sql
stable
security invoker
set search_path to ''
as $function$
  select
    exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role = ur.role
      join public.permissions p on p.id = rp.permission_id
      where ur.user_id = (select auth.uid())
        and p.key = p_permission_key
    )
    and (
      not exists (
        select 1
        from public.user_roles ur
        where ur.user_id = (select auth.uid())
          and ur.role = 'super_admin'
      )
      or private.is_current_super_admin_device_trusted()
    );
$function$;

revoke all on function public.current_user_has_permission(text) from public, anon;
grant execute on function public.current_user_has_permission(text) to authenticated, service_role;

create or replace function private.admin_approve_super_admin_device(p_device_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_device public.super_admin_devices%rowtype;
begin
  if v_actor is null
     or not public.has_any_admin_role()
     or not exists (
       select 1 from public.user_roles
       where user_id = v_actor and role = 'super_admin'
     ) then
    raise exception 'forbidden';
  end if;

  select * into v_device
  from public.super_admin_devices
  where id = p_device_id and user_id = v_actor and status = 'pending'
  for update;

  if not found then raise exception 'device_not_found_or_not_pending'; end if;

  update public.super_admin_devices
  set status = 'approved', approved_at = now(), revoked_at = null, session_id = null
  where id = v_device.id;

  insert into public.admin_actions(admin_id, action, target_type, target_id, reason, metadata)
  values (
    v_actor, 'super_admin_device_approved', 'super_admin_device', v_device.id,
    'Appareil approuvé depuis un appareil de confiance',
    jsonb_build_object('device_name', v_device.device_name)
  );

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
  values (
    v_actor, 'update'::public.audit_action, 'super_admin_device', v_device.id,
    'Trusted Super Admin device approved',
    jsonb_build_object('status', 'approved', 'device_name', v_device.device_name)
  );
end;
$function$;

create or replace function private.admin_revoke_super_admin_device(p_device_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_device public.super_admin_devices%rowtype;
begin
  if v_actor is null
     or not public.has_any_admin_role()
     or not exists (
       select 1 from public.user_roles
       where user_id = v_actor and role = 'super_admin'
     ) then
    raise exception 'forbidden';
  end if;

  select * into v_device
  from public.super_admin_devices
  where id = p_device_id and user_id = v_actor and status = 'approved'
  for update;

  if not found then raise exception 'device_not_found_or_not_approved'; end if;
  if v_device.session_id is not null
     and v_device.session_id::text = (select auth.jwt() ->> 'session_id') then
    raise exception 'cannot_revoke_current_device';
  end if;

  update public.super_admin_devices
  set status = 'revoked', revoked_at = now(), session_id = null
  where id = v_device.id;

  insert into public.admin_actions(admin_id, action, target_type, target_id, reason, metadata)
  values (
    v_actor, 'super_admin_device_revoked', 'super_admin_device', v_device.id,
    'Appareil révoqué depuis un appareil de confiance',
    jsonb_build_object('device_name', v_device.device_name)
  );

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
  values (
    v_actor, 'update'::public.audit_action, 'super_admin_device', v_device.id,
    'Trusted Super Admin device revoked',
    jsonb_build_object('status', 'revoked', 'device_name', v_device.device_name)
  );
end;
$function$;

revoke all on function private.admin_approve_super_admin_device(uuid) from public, anon;
revoke all on function private.admin_revoke_super_admin_device(uuid) from public, anon;
grant execute on function private.admin_approve_super_admin_device(uuid) to authenticated, service_role;
grant execute on function private.admin_revoke_super_admin_device(uuid) to authenticated, service_role;

create or replace function public.admin_approve_super_admin_device(p_device_id uuid)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  perform private.admin_approve_super_admin_device(p_device_id);
end;
$function$;

create or replace function public.admin_revoke_super_admin_device(p_device_id uuid)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  perform private.admin_revoke_super_admin_device(p_device_id);
end;
$function$;

revoke all on function public.admin_approve_super_admin_device(uuid) from public, anon;
revoke all on function public.admin_revoke_super_admin_device(uuid) from public, anon;
grant execute on function public.admin_approve_super_admin_device(uuid) to authenticated, service_role;
grant execute on function public.admin_revoke_super_admin_device(uuid) to authenticated, service_role;


-- Close the remaining Super Admin-only RPC paths that still checked AAL2
-- without checking the approved device-bound session.
create or replace function public.admin_operations_snapshot()
returns jsonb
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  if not exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = 'super_admin'
  ) or not private.is_current_super_admin_device_trusted() then
    raise exception 'forbidden';
  end if;

  return private.admin_operations_snapshot();
end;
$function$;

-- Preserve the existing privileged implementations, but make their callable
-- entry points enforce the device-bound session first.
alter function private.admin_set_associate_role(uuid, boolean, text)
  rename to admin_set_associate_role_legacy;
revoke all on function private.admin_set_associate_role_legacy(uuid, boolean, text)
  from public, anon, authenticated, service_role;

create or replace function private.admin_set_associate_role(
  p_user_id uuid, p_enabled boolean, p_note text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if auth.uid() is null
     or not exists (
       select 1 from public.user_roles
       where user_id = (select auth.uid()) and role = 'super_admin'
     )
     or not private.is_current_super_admin_device_trusted() then
    raise exception 'forbidden';
  end if;

  perform private.admin_set_associate_role_legacy(p_user_id, p_enabled, p_note);
end;
$function$;

revoke all on function private.admin_set_associate_role(uuid, boolean, text)
  from public, anon;
grant execute on function private.admin_set_associate_role(uuid, boolean, text)
  to authenticated, service_role;

create or replace function public.admin_set_associate_role(
  p_user_id uuid, p_enabled boolean, p_note text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if auth.uid() is null
     or not exists (
       select 1 from public.user_roles
       where user_id = (select auth.uid()) and role = 'super_admin'
     )
     or not private.is_current_super_admin_device_trusted() then
    raise exception 'forbidden';
  end if;

  perform private.admin_set_associate_role(p_user_id, p_enabled, p_note);
end;
$function$;

revoke all on function public.admin_set_associate_role(uuid, boolean, text)
  from public, anon;
grant execute on function public.admin_set_associate_role(uuid, boolean, text)
  to authenticated, service_role;

alter function private.admin_update_payout(uuid, text, text)
  rename to admin_update_payout_legacy;
revoke all on function private.admin_update_payout_legacy(uuid, text, text)
  from public, anon, authenticated, service_role;

create or replace function private.admin_update_payout(
  p_payout_id uuid, p_action text, p_reason text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_admin uuid := auth.uid();
  v_role_ok boolean;
begin
  if v_admin is null then raise exception 'not_authenticated'; end if;

  select exists(
    select 1 from public.user_roles
    where user_id = v_admin
      and role in ('super_admin','admin','finance_admin')
  ) into v_role_ok;

  if not v_role_ok then raise exception 'not_authorized'; end if;

  if exists (
    select 1 from public.user_roles
    where user_id = v_admin and role = 'super_admin'
  ) and not private.is_current_super_admin_device_trusted() then
    raise exception 'forbidden';
  end if;

  perform private.admin_update_payout_legacy(p_payout_id, p_action, p_reason);
end;
$function$;

revoke all on function private.admin_update_payout(uuid, text, text)
  from public, anon;
grant execute on function private.admin_update_payout(uuid, text, text)
  to authenticated, service_role;
