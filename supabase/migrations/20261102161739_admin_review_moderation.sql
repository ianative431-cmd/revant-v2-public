-- Admin review moderation. Additive RPC only: no existing review rows or policies are changed.
create or replace function private.admin_moderate_review(
  p_review_id uuid, p_publish boolean, p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, private
as $function$
declare review_row public.reviews%rowtype;
begin
  if auth.uid() is null or not public.current_user_has_permission('support.manage') then
    raise exception 'forbidden';
  end if;
  if p_note is not null and length(trim(p_note)) > 500 then raise exception 'note_too_long'; end if;
  select * into review_row from public.reviews where id = p_review_id for update;
  if not found then raise exception 'review_not_found'; end if;

  update public.reviews set is_published = p_publish, updated_at = now() where id = p_review_id;

  insert into public.admin_actions(admin_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), case when p_publish then 'publish_review' else 'unpublish_review' end,
    'review', p_review_id, nullif(trim(p_note), ''), jsonb_build_object('is_published', p_publish));

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
  values (auth.uid(), 'update'::public.audit_action, 'review', p_review_id,
    'Review visibility changed by admin', jsonb_build_object('is_published', p_publish));
end;
$function$;

create or replace function public.admin_moderate_review(
  p_review_id uuid, p_publish boolean, p_note text default null
)
returns void
language plpgsql
set search_path = ''
as $function$
begin
  if not public.current_user_has_permission('support.manage') then raise exception 'forbidden'; end if;
  perform private.admin_moderate_review(p_review_id, p_publish, p_note);
end;
$function$;

revoke all on function private.admin_moderate_review(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.admin_moderate_review(uuid, boolean, text) from public, anon;
grant execute on function public.admin_moderate_review(uuid, boolean, text) to authenticated;
