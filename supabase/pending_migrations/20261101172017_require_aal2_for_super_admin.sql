-- Super-administrator access must require a verified second factor at the database boundary too.
-- The application guard redirects the browser to the TOTP challenge; these checks prevent
-- direct PostgREST/RPC calls from bypassing that application flow with an aal1 JWT.

create or replace function public.current_user_has_permission(p_permission_key text)
returns boolean
language sql
stable
set search_path to ''
as $function$
  select
    (
      not exists (
        select 1
        from public.user_roles ur
        where ur.user_id = (select auth.uid())
          and ur.role = 'super_admin'
      )
      or (select auth.jwt() ->> 'aal') = 'aal2'
    )
    and exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role = ur.role
      join public.permissions p on p.id = rp.permission_id
      where ur.user_id = (select auth.uid())
        and p.key = p_permission_key
    );
$function$;

create or replace function public.has_any_admin_role()
returns boolean
language sql
stable
set search_path to 'public'
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
      or (select auth.jwt() ->> 'aal') = 'aal2'
    );
$function$;

create or replace function public.admin_operations_snapshot()
returns jsonb
language plpgsql
set search_path to ''
as $function$
begin
  if not exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = 'super_admin'
  ) or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'forbidden';
  end if;

  return private.admin_operations_snapshot();
end;
$function$;
