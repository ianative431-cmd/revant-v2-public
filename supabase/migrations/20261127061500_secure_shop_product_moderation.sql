-- Secure seller product-status changes and add transactional admin product moderation.
-- No existing shop/product records are changed by this migration.

create or replace function private.guard_product_writes()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  v_shop_status text;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_featured then
      raise exception 'product_field_forbidden' using errcode = '42501';
    end if;
    if new.status not in ('active'::public.product_status, 'pending'::public.product_status) then
      raise exception 'product_status_forbidden' using errcode = '42501';
    end if;
  else
    if new.is_featured is distinct from old.is_featured then
      raise exception 'product_field_forbidden' using errcode = '42501';
    end if;
    if new.status is distinct from old.status
       and not (
         (old.status = 'active' and new.status = 'archived')
         or (old.status = 'archived' and new.status = 'active')
       ) then
      raise exception 'product_status_forbidden' using errcode = '42501';
    end if;
  end if;

  if new.status = 'active'
     and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    select s.status::text into v_shop_status
    from public.shops s
    where s.id = new.shop_id;
    if v_shop_status is distinct from 'active' then
      raise exception 'shop_not_active' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$function$;

create or replace function private.admin_moderate_product(
  p_product_id uuid,
  p_next_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_old_status text;
  v_shop_status text;
  v_action text;
  v_audit_action public.audit_action;
begin
  if auth.uid() is null
     or not public.current_user_has_permission('products.manage') then
    raise exception 'forbidden';
  end if;

  if p_next_status is null or p_next_status not in ('active', 'rejected') then
    raise exception 'invalid_product_decision';
  end if;
  if p_note is not null and length(trim(p_note)) > 500 then
    raise exception 'note_too_long';
  end if;
  if p_next_status = 'rejected'
     and length(trim(coalesce(p_note, ''))) not between 5 and 500 then
    raise exception 'rejection_reason_required';
  end if;

  select p.status::text, s.status::text
    into v_old_status, v_shop_status
  from public.products p
  join public.shops s on s.id = p.shop_id
  where p.id = p_product_id
  for update of p;

  if not found then raise exception 'product_not_found'; end if;
  if v_old_status <> 'pending' then raise exception 'product_not_pending'; end if;
  if p_next_status = 'active' and v_shop_status <> 'active' then
    raise exception 'shop_not_active';
  end if;

  update public.products
  set status = p_next_status::public.product_status
  where id = p_product_id and status = 'pending';
  if not found then raise exception 'product_not_pending'; end if;

  v_action := case when p_next_status = 'active' then 'approve_product' else 'reject_product' end;
  v_audit_action := case when p_next_status = 'active'
    then 'approve'::public.audit_action else 'reject'::public.audit_action end;

  insert into public.admin_actions(admin_id, action, target_type, target_id, reason, metadata)
  values (
    auth.uid(), v_action, 'product', p_product_id, nullif(trim(p_note), ''),
    jsonb_build_object('from_status', v_old_status, 'to_status', p_next_status)
  );

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
  values (
    auth.uid(), v_audit_action, 'product', p_product_id,
    case when p_next_status = 'active'
      then 'Product approved by catalog moderation'
      else 'Product rejected by catalog moderation'
    end,
    jsonb_build_object('from_status', v_old_status, 'to_status', p_next_status)
  );
end;
$function$;

create or replace function public.admin_moderate_product(
  p_product_id uuid,
  p_next_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.current_user_has_permission('products.manage') then
    raise exception 'forbidden';
  end if;
  perform private.admin_moderate_product(p_product_id, p_next_status, p_note);
end;
$function$;

revoke all on function private.admin_moderate_product(uuid, text, text)
  from public, anon, authenticated;
grant execute on function private.admin_moderate_product(uuid, text, text)
  to service_role;
revoke all on function public.admin_moderate_product(uuid, text, text)
  from public, anon;
grant execute on function public.admin_moderate_product(uuid, text, text)
  to authenticated;
