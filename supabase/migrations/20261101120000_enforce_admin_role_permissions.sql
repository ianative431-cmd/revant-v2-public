-- Enforce the existing role_permissions matrix at the database API boundary.
-- This helper only evaluates the current caller's own assigned permissions.
create or replace function public.current_user_has_permission(p_permission_key text)
returns boolean
language sql
stable
security invoker
set search_path to ''
as $function$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role = ur.role
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = (select auth.uid())
      and p.key = p_permission_key
  );
$function$;

revoke all on function public.current_user_has_permission(text) from public, anon;
grant execute on function public.current_user_has_permission(text) to authenticated, service_role;

create or replace function public.admin_finance_snapshot()
returns jsonb language plpgsql security invoker set search_path to ''
as $function$
begin
  if not public.current_user_has_permission('finance.view') then raise exception 'forbidden'; end if;
  return private.admin_finance_snapshot();
end;
$function$;

create or replace function public.admin_operations_snapshot()
returns jsonb language plpgsql security invoker set search_path to ''
as $function$
begin
  if not exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'super_admin'
  ) then raise exception 'forbidden'; end if;
  return private.admin_operations_snapshot();
end;
$function$;

create or replace function public.admin_overview_snapshot()
returns jsonb language plpgsql security invoker set search_path to ''
as $function$
begin
  if not public.current_user_has_permission('users.view') then raise exception 'forbidden'; end if;
  return private.admin_overview_snapshot();
end;
$function$;

create or replace function public.admin_set_user_suspension(
  p_user_id uuid, p_suspended boolean, p_reason text default null
)
returns void language plpgsql security invoker set search_path to ''
as $function$
begin
  if not public.current_user_has_permission('users.manage') then raise exception 'forbidden'; end if;
  perform private.admin_set_user_suspension(p_user_id, p_suspended, p_reason);
end;
$function$;

create or replace function public.admin_shops_list(p_limit integer default 500)
returns jsonb language plpgsql security invoker set search_path to ''
as $function$
begin
  if not public.current_user_has_permission('shops.view') then raise exception 'forbidden'; end if;
  return private.admin_shops_list(p_limit);
end;
$function$;

create or replace function public.admin_update_dispute(
  p_dispute_id uuid, p_action text, p_note text default null
)
returns void language plpgsql security invoker set search_path to ''
as $function$
begin
  if not public.current_user_has_permission('support.manage') then raise exception 'forbidden'; end if;
  perform private.admin_update_dispute(p_dispute_id, p_action, p_note);
end;
$function$;

create or replace function public.admin_update_kyc(
  p_kyc_id uuid, p_action text, p_reason text default null
)
returns void language plpgsql security invoker set search_path to ''
as $function$
begin
  if not public.current_user_has_permission('kyc.manage') then raise exception 'forbidden'; end if;
  perform private.admin_update_kyc(p_kyc_id, p_action, p_reason);
end;
$function$;

create or replace function public.admin_update_payout(
  p_payout_id uuid, p_action text, p_reason text default null
)
returns void language plpgsql security invoker set search_path to ''
as $function$
begin
  if not public.current_user_has_permission('payouts.manage') then raise exception 'forbidden'; end if;
  perform private.admin_update_payout(p_payout_id, p_action, p_reason);
end;
$function$;

create or replace function public.admin_update_report(
  p_report_id uuid, p_action text, p_note text default null
)
returns void language plpgsql security invoker set search_path to ''
as $function$
begin
  if not public.current_user_has_permission('support.manage') then raise exception 'forbidden'; end if;
  perform private.admin_update_report(p_report_id, p_action, p_note);
end;
$function$;

create or replace function public.admin_user_directory(p_limit integer default 200)
returns jsonb language plpgsql security invoker set search_path to ''
as $function$
begin
  if not public.current_user_has_permission('users.view') then raise exception 'forbidden'; end if;
  return private.admin_user_directory(p_limit);
end;
$function$;

-- Commission/configuration writes always use the authenticated actor from
-- the session, never an actor ID supplied by the browser.
create or replace function private.admin_set_setting(p_key text, p_value jsonb)
returns void language plpgsql security definer set search_path to ''
as $function$
declare
  v_type text;
  v_old jsonb;
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.current_user_has_permission('settings.manage') then
    raise exception 'forbidden';
  end if;

  select value_type::text, value into v_type, v_old
  from public.system_settings where key = p_key for update;
  if not found then raise exception 'Paramètre inconnu : %', p_key; end if;

  if v_type = 'number' and jsonb_typeof(p_value) <> 'number' then raise exception 'Valeur numérique attendue'; end if;
  if v_type = 'boolean' and jsonb_typeof(p_value) <> 'boolean' then raise exception 'Valeur booléenne attendue'; end if;
  if v_type = 'string' and jsonb_typeof(p_value) <> 'string' then raise exception 'Texte attendu'; end if;

  if p_key = 'revant.commission_percent' and ((p_value)::numeric < 0 or (p_value)::numeric > 100) then
    raise exception 'La commission doit être comprise entre 0 et 100 %%';
  end if;

  update public.system_settings set value = p_value, updated_by = v_actor, updated_at = now() where key = p_key;
  insert into public.audit_logs (actor_id, action, entity_type, description, metadata)
  values (v_actor, 'config_change', 'system_settings', 'Modification du paramètre ' || p_key,
          jsonb_build_object('key', p_key, 'old', v_old, 'new', p_value));
end;
$function$;

revoke all on function private.admin_set_setting(text, jsonb) from public, anon;
grant execute on function private.admin_set_setting(text, jsonb) to authenticated, service_role;

create or replace function public.admin_set_setting(p_key text, p_value jsonb, p_actor uuid)
returns void language plpgsql security invoker set search_path to ''
as $function$
begin
  if p_actor is distinct from (select auth.uid()) then raise exception 'actor_mismatch'; end if;
  perform private.admin_set_setting(p_key, p_value);
end;
$function$;

revoke all on function public.admin_set_setting(text, jsonb, uuid) from public, anon;
grant execute on function public.admin_set_setting(text, jsonb, uuid) to authenticated, service_role;
