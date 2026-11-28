-- Return approved products to moderation whenever seller-visible commercial content or photos change.
-- This migration changes no existing rows; it only installs database-side guards and audit triggers.

create or replace function private.guard_product_writes()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  v_shop_status text;
  v_content_changed boolean := false;
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
    v_content_changed :=
      new.name is distinct from old.name
      or new.description is distinct from old.description
      or new.base_price is distinct from old.base_price
      or new.category_id is distinct from old.category_id
      or new.product_type is distinct from old.product_type
      or new.size_stock is distinct from old.size_stock
      or new.perfume_volume_ml is distinct from old.perfume_volume_ml;

    if new.is_featured is distinct from old.is_featured then
      raise exception 'product_field_forbidden' using errcode = '42501';
    end if;

    -- A seller cannot choose the moderation state. An approved product is
    -- automatically returned to pending when its commercial content changes.
    if old.status = 'active' and v_content_changed then
      new.status := 'pending';
    end if;

    if new.status is distinct from old.status
       and not (
         (old.status = 'active' and new.status = 'archived')
         or (old.status = 'archived' and new.status = 'active')
         or (old.status = 'active' and new.status = 'pending' and v_content_changed)
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

create or replace function private.audit_product_remoderation()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if old.status = 'active' and new.status = 'pending' then
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
    values (
      auth.uid(),
      'update'::public.audit_action,
      'product',
      new.id,
      'Product returned to moderation after seller content or image changes',
      jsonb_build_object(
        'from_status', old.status::text,
        'to_status', new.status::text,
        'reason', 'approved_product_content_changed'
      )
    );
  end if;
  return new;
end;
$function$;

drop trigger if exists audit_product_remoderation on public.products;
create trigger audit_product_remoderation
after update on public.products
for each row
when (old.status = 'active' and new.status = 'pending')
execute function private.audit_product_remoderation();

create or replace function private.remoderate_product_after_image_change()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_product_id uuid;
begin
  if tg_op = 'DELETE' then
    v_product_id := old.product_id;
    update public.products set status = 'pending'
    where id = v_product_id and status = 'active';
    return old;
  end if;

  update public.products set status = 'pending'
  where id = new.product_id and status = 'active';

  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    update public.products set status = 'pending'
    where id = old.product_id and status = 'active';
  end if;

  return new;
end;
$function$;

drop trigger if exists remoderate_product_after_image_change on public.product_images;
create trigger remoderate_product_after_image_change
after insert or update or delete on public.product_images
for each row
execute function private.remoderate_product_after_image_change();

revoke all on function private.audit_product_remoderation() from public, anon, authenticated;
revoke all on function private.remoderate_product_after_image_change() from public, anon, authenticated;
