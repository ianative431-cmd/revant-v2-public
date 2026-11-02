-- Give each user a usable notification inbox without allowing client-side edits
-- to notification content, recipients, types or metadata.

drop policy if exists "users mark own notifications read" on public.notifications;
 revoke insert, update, delete on public.notifications from anon, authenticated;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '42501'; end if;

  update public.notifications
  set read_at = coalesce(read_at, now())
  where id = p_notification_id
    and user_id = auth.uid();

  return found;
end;
$function$;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_count integer;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '42501'; end if;

  update public.notifications
  set read_at = now()
  where user_id = auth.uid() and read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

revoke all on function public.mark_notification_read(uuid) from public, anon;
revoke all on function public.mark_all_notifications_read() from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
