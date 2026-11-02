insert into public.role_permissions(role, permission_id)
select 'associate'::public.user_role, p.id
from public.permissions p
where p.key in ('products.view', 'shops.view')
on conflict do nothing;

create or replace function private.admin_set_associate_role(
  p_user_id uuid,
  p_enabled boolean,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, private
as $function$
declare changed boolean := false;
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'::public.user_role
  ) then raise exception 'forbidden'; end if;

  if p_note is not null and length(trim(p_note)) > 500 then raise exception 'note_too_long'; end if;
  if not exists (select 1 from auth.users where id = p_user_id) then raise exception 'user_not_found'; end if;

  if p_enabled then
    insert into public.user_roles(user_id, role)
    values (p_user_id, 'associate'::public.user_role)
    on conflict (user_id, role) do nothing;
    changed := found;
  else
    delete from public.user_roles
    where user_id = p_user_id and role = 'associate'::public.user_role;
    changed := found;
  end if;

  if not changed then return; end if;

  insert into public.admin_actions(admin_id, action, target_type, target_id, reason, metadata)
  values (
    auth.uid(),
    case when p_enabled then 'grant_associate' else 'revoke_associate' end,
    'user',
    p_user_id,
    nullif(trim(p_note), ''),
    jsonb_build_object('role', 'associate', 'enabled', p_enabled)
  );

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
  values (
    auth.uid(),
    'role_change'::public.audit_action,
    'user',
    p_user_id,
    case when p_enabled then 'Associate access granted' else 'Associate access revoked' end,
    jsonb_build_object('role', 'associate', 'enabled', p_enabled)
  );
end;
$function$;

create or replace function public.admin_set_associate_role(
  p_user_id uuid,
  p_enabled boolean,
  p_note text default null
)
returns void
language plpgsql
set search_path = ''
as $function$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'::public.user_role
  ) then raise exception 'forbidden'; end if;
  perform private.admin_set_associate_role(p_user_id, p_enabled, p_note);
end;
$function$;

revoke all on function private.admin_set_associate_role(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.admin_set_associate_role(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_associate_role(uuid, boolean, text) to authenticated;
