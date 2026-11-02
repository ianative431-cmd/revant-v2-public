-- Allow the authenticated wrapper to invoke the private SECURITY DEFINER implementation.
-- The wrapper repeats the super_admin check before crossing the privilege boundary.
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
  if auth.uid() is null or not exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'super_admin'::public.user_role
  ) then
    raise exception 'forbidden';
  end if;

  perform private.admin_set_associate_role(p_user_id, p_enabled, p_note);
end;
$function$;

revoke all on function public.admin_set_associate_role(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_associate_role(uuid, boolean, text) to authenticated;
