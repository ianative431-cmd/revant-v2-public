-- Correct the wrapper execution context for private admin RPCs.
-- The public wrappers must execute as their owner so they can call private functions
-- whose EXECUTE privilege is intentionally revoked from authenticated users.
create or replace function public.admin_set_associate_role(
  p_user_id uuid,
  p_enabled boolean,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'::public.user_role
  ) then
    raise exception 'forbidden';
  end if;
  perform private.admin_set_associate_role(p_user_id, p_enabled, p_note);
end;
$function$;

create or replace function public.admin_moderate_review(
  p_review_id uuid, p_publish boolean, p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not public.current_user_has_permission('support.manage') then
    raise exception 'forbidden';
  end if;
  perform private.admin_moderate_review(p_review_id, p_publish, p_note);
end;
$function$;

revoke all on function public.admin_set_associate_role(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_associate_role(uuid, boolean, text) to authenticated;
revoke all on function public.admin_moderate_review(uuid, boolean, text) from public, anon;
grant execute on function public.admin_moderate_review(uuid, boolean, text) to authenticated;
