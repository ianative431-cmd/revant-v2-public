-- Persist the selected product variant on each order line and keep per-size inventory atomic.
alter table public.order_items
  add column if not exists variant_label text;

do $constraint$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_variant_label_check'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_variant_label_check
      check (variant_label is null or (length(btrim(variant_label)) between 1 and 50));
  end if;
end;
$constraint$;

comment on column public.order_items.variant_label is
  'Immutable variant label selected at checkout; NULL for products without variants and legacy order lines.';


create or replace function private.prevent_order_item_variant_mutation()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.variant_label is distinct from old.variant_label then
    raise exception 'order_variant_immutable';
  end if;
  return new;
end;
$function$;

drop trigger if exists order_items_variant_label_immutable on public.order_items;
create trigger order_items_variant_label_immutable
before update of variant_label on public.order_items
for each row execute function private.prevent_order_item_variant_mutation();

revoke all on function private.prevent_order_item_variant_mutation() from public, anon, authenticated, service_role;

-- New implementation keeps the current service-role buyer binding, idempotency,
-- phone rate limit, shop checks and no-reservation-until-seller-confirmation policy.
create or replace function private.create_guest_order_impl(
  p_product_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_guest_city text,
  p_guest_address text,
  p_tracking_token_hash text,
  p_website text,
  p_idempotency_key uuid,
  p_buyer_id uuid,
  p_quantity integer,
  p_variant_label text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_product record;
  v_existing record;
  v_order_id uuid;
  v_order_number text;
  v_phone text;
  v_buyer_id uuid := case
    when (select auth.role()) = 'service_role' then p_buyer_id
    else (select auth.uid())
  end;
  v_recent_orders integer;
  v_variant_label text := nullif(btrim(p_variant_label), '');
begin
  if p_idempotency_key is null
     or coalesce(trim(p_website), '') <> ''
     or p_quantity is null or p_quantity < 1 or p_quantity > 99
     or (p_variant_label is not null and (v_variant_label is null or length(v_variant_label) > 50)) then
    raise exception 'invalid request';
  end if;

  if p_product_id is null
     or p_guest_name is null or length(trim(p_guest_name)) < 2 or length(trim(p_guest_name)) > 100
     or p_guest_phone is null or length(trim(p_guest_phone)) < 8 or length(trim(p_guest_phone)) > 24
     or p_guest_phone ~ '[^0-9+() .-]'
     or length(regexp_replace(trim(p_guest_phone), '[^0-9]', '', 'g')) < 8
     or length(regexp_replace(trim(p_guest_phone), '[^0-9]', '', 'g')) > 15
     or p_guest_city is null or length(trim(p_guest_city)) < 2 or length(trim(p_guest_city)) > 100
     or p_guest_address is null or length(trim(p_guest_address)) < 5 or length(trim(p_guest_address)) > 300
     or p_tracking_token_hash is null or p_tracking_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid request';
  end if;

  if v_buyer_id is not null and not exists (
    select 1 from auth.users u where u.id = v_buyer_id
  ) then
    raise exception 'invalid request';
  end if;

  v_phone := regexp_replace(trim(p_guest_phone), '[^0-9]', '', 'g');

  -- Serialize repeated submissions with the same key before checking the existing order.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  select
    o.id,
    o.order_number,
    o.buyer_id,
    o.guest_phone,
    o.guest_name,
    o.guest_city,
    o.guest_address,
    o.guest_tracking_token_hash,
    oi.product_id,
    oi.quantity,
    oi.variant_label
  into v_existing
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  where o.idempotency_key = p_idempotency_key
  limit 1;

  if found then
    if v_existing.product_id is distinct from p_product_id
       or v_existing.quantity is distinct from p_quantity
       or v_existing.variant_label is distinct from v_variant_label
       or v_existing.buyer_id is distinct from v_buyer_id
       or v_existing.guest_phone is distinct from v_phone
       or v_existing.guest_name is distinct from trim(p_guest_name)
       or v_existing.guest_city is distinct from trim(p_guest_city)
       or v_existing.guest_address is distinct from trim(p_guest_address)
       or v_existing.guest_tracking_token_hash is distinct from p_tracking_token_hash then
      raise exception 'idempotency_conflict';
    end if;

    return jsonb_build_object(
      'order_id', v_existing.id,
      'order_number', v_existing.order_number
    );
  end if;

  select count(*)::integer into v_recent_orders
  from public.orders o
  where o.guest_phone = v_phone
    and o.created_at > now() - interval '1 hour';
  if v_recent_orders >= 3 then
    raise exception 'rate limit exceeded';
  end if;

  select
    p.id,
    p.name,
    p.base_price,
    p.currency,
    p.stock_quantity,
    coalesce(p.size_stock, '{}'::jsonb) as size_stock,
    p.product_type,
    p.shop_id,
    s.owner_id,
    s.name as shop_name,
    s.city as shop_city,
    s.phone as shop_phone
  into v_product
  from public.products p
  join public.shops s on s.id = p.shop_id
  where p.id = p_product_id
    and p.status = 'active'
    and p.stock_quantity > 0
    and s.status = 'active'
  for update of p;

  if not found or v_product.stock_quantity < p_quantity then
    raise exception 'product unavailable';
  end if;

  if v_buyer_id is not null and v_product.owner_id = v_buyer_id then
    raise exception 'cannot order own product';
  end if;

  if v_product.product_type = 'clothing'
     and jsonb_typeof(v_product.size_stock) = 'object' then
    if jsonb_object_length(v_product.size_stock) > 0 then
      if v_variant_label is null then
        raise exception 'variant_required';
      end if;
      if not (v_product.size_stock ? v_variant_label)
         or jsonb_typeof(v_product.size_stock -> v_variant_label) is distinct from 'number'
         or (v_product.size_stock ->> v_variant_label) !~ '^[0-9]+$' then
        raise exception 'product_variant_unavailable_or_insufficient_stock';
      end if;
      if (v_product.size_stock ->> v_variant_label)::integer < p_quantity then
        raise exception 'product_variant_unavailable_or_insufficient_stock';
      end if;
    elsif v_variant_label is not null then
      raise exception 'invalid_product_variant';
    end if;
  elsif v_variant_label is not null then
    raise exception 'invalid_product_variant';
  end if;

  -- Inventory is reserved only when the seller accepts the order.
  v_order_number := 'RVT-' || upper(to_char(clock_timestamp(), 'YYMMDDHH24MISS')) || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (
    buyer_id, order_number, status, currency, subtotal, delivery_fee, total_amount, placed_at,
    guest_name, guest_phone, guest_city, guest_address, guest_tracking_token_hash,
    idempotency_key, stock_reserved
  ) values (
    v_buyer_id, v_order_number, 'pending', v_product.currency,
    v_product.base_price * p_quantity, 0, v_product.base_price * p_quantity, now(),
    trim(p_guest_name), v_phone, trim(p_guest_city), trim(p_guest_address),
    p_tracking_token_hash, p_idempotency_key, false
  ) returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, shop_id, product_name, variant_label,
    quantity, unit_price, line_total, currency
  ) values (
    v_order_id, v_product.id, v_product.shop_id, v_product.name, v_variant_label,
    p_quantity, v_product.base_price, v_product.base_price * p_quantity, v_product.currency
  );

  insert into public.deliveries(order_id, status, delivery_address, pickup_address)
  values (
    v_order_id,
    'unassigned',
    concat_ws(' · ', trim(p_guest_name), v_phone, trim(p_guest_address), trim(p_guest_city)),
    concat_ws(' · ', v_product.shop_name, v_product.shop_city, v_product.shop_phone)
  );

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
end;
$function$;

-- Keep the previous private signature safe for older server callers: a size-required
-- clothing product now fails closed when no variant was supplied.
create or replace function private.create_guest_order_impl(
  p_product_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_guest_city text,
  p_guest_address text,
  p_tracking_token_hash text,
  p_website text,
  p_idempotency_key uuid,
  p_buyer_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
begin
  return private.create_guest_order_impl(
    p_product_id, p_guest_name, p_guest_phone, p_guest_city, p_guest_address,
    p_tracking_token_hash, p_website, p_idempotency_key, p_buyer_id, 1, null
  );
end;
$function$;

-- Legacy nine-argument RPC remains available to the trusted server role.
create or replace function public.create_guest_order(
  p_product_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_guest_city text,
  p_guest_address text,
  p_tracking_token_hash text,
  p_website text,
  p_idempotency_key uuid,
  p_buyer_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  return private.create_guest_order_impl(
    p_product_id, p_guest_name, p_guest_phone, p_guest_city, p_guest_address,
    p_tracking_token_hash, p_website, p_idempotency_key, p_buyer_id, 1, null
  );
end;
$function$;

-- Existing quantity-aware RPC is preserved but cannot omit a required size.
create or replace function public.create_guest_order(
  p_product_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_guest_city text,
  p_guest_address text,
  p_tracking_token_hash text,
  p_website text,
  p_idempotency_key uuid,
  p_buyer_id uuid,
  p_quantity integer
)
returns jsonb
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  return private.create_guest_order_impl(
    p_product_id, p_guest_name, p_guest_phone, p_guest_city, p_guest_address,
    p_tracking_token_hash, p_website, p_idempotency_key, p_buyer_id, p_quantity, null
  );
end;
$function$;

-- Variant-aware server-only guest checkout RPC.
create or replace function public.create_guest_order(
  p_product_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_guest_city text,
  p_guest_address text,
  p_tracking_token_hash text,
  p_website text,
  p_idempotency_key uuid,
  p_buyer_id uuid,
  p_quantity integer,
  p_variant_label text
)
returns jsonb
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  return private.create_guest_order_impl(
    p_product_id, p_guest_name, p_guest_phone, p_guest_city, p_guest_address,
    p_tracking_token_hash, p_website, p_idempotency_key, p_buyer_id, p_quantity, p_variant_label
  );
end;
$function$;

revoke all on function private.create_guest_order_impl(uuid,text,text,text,text,text,text,uuid,uuid,integer,text) from public, anon, authenticated;
grant execute on function private.create_guest_order_impl(uuid,text,text,text,text,text,text,uuid,uuid,integer,text) to service_role;
revoke all on function private.create_guest_order_impl(uuid,text,text,text,text,text,text,uuid,uuid) from public, anon, authenticated;
grant execute on function private.create_guest_order_impl(uuid,text,text,text,text,text,text,uuid,uuid) to service_role;

revoke all on function public.create_guest_order(uuid,text,text,text,text,text,text,uuid,uuid) from public, anon, authenticated;
grant execute on function public.create_guest_order(uuid,text,text,text,text,text,text,uuid,uuid) to service_role;
revoke all on function public.create_guest_order(uuid,text,text,text,text,text,text,uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.create_guest_order(uuid,text,text,text,text,text,text,uuid,uuid,integer) to service_role;
revoke all on function public.create_guest_order(uuid,text,text,text,text,text,text,uuid,uuid,integer,text) from public, anon, authenticated;
grant execute on function public.create_guest_order(uuid,text,text,text,text,text,text,uuid,uuid,integer,text) to service_role;

-- Guest tracking remains protected by the existing per-device token and now returns the size snapshot.
create or replace function private.get_guest_order_impl(
  p_order_number text,
  p_tracking_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_result jsonb;
begin
  if p_order_number is null or p_tracking_token_hash is null
     or p_tracking_token_hash !~ '^[0-9a-f]{64}$' then
    return null;
  end if;

  select jsonb_build_object(
    'order_number', o.order_number,
    'status', o.status::text,
    'total_amount', o.total_amount,
    'currency', btrim(o.currency::text),
    'product_name', oi.product_name,
    'variant_label', oi.variant_label,
    'shop_name', s.name,
    'created_at', o.created_at,
    'delivery_status', d.status::text,
    'delivery_code_ciphertext', cs.code_ciphertext,
    'delivery_code_hint', cs.code_hint
  ) into v_result
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  join public.shops s on s.id = oi.shop_id
  left join public.deliveries d on d.order_id = o.id
  left join private.delivery_code_secrets cs on cs.delivery_id = d.id
  where o.order_number = p_order_number
    and o.guest_tracking_token_hash = p_tracking_token_hash
  limit 1;

  return v_result;
end;
$function$;

revoke all on function private.get_guest_order_impl(text,text) from public, anon, authenticated;
grant execute on function private.get_guest_order_impl(text,text) to service_role;

-- One helper updates the aggregate stock and the selected size in the same transaction.
create or replace function private.apply_order_item_stock(p_order_id uuid, p_restore boolean)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_item record;
  v_stock integer;
  v_size_stock jsonb;
  v_variant_stock integer;
  v_product_status text;
  v_shop_status text;
begin
  for v_item in
    select oi.id, oi.product_id, oi.quantity, oi.variant_label
    from public.order_items oi
    where oi.order_id = p_order_id
    order by oi.product_id, oi.variant_label nulls first, oi.id
  loop
    select
      p.stock_quantity,
      coalesce(p.size_stock, '{}'::jsonb),
      p.status::text,
      s.status::text
    into v_stock, v_size_stock, v_product_status, v_shop_status
    from public.products p
    join public.shops s on s.id = p.shop_id
    where p.id = v_item.product_id
    for update of p;

    if not found then
      raise exception 'product unavailable';
    end if;

    if not p_restore and (v_product_status <> 'active' or v_shop_status <> 'active') then
      raise exception 'product_unavailable_or_insufficient_stock';
    end if;

    v_variant_stock := null;
    if v_item.variant_label is not null then
      if p_restore and jsonb_typeof(v_size_stock) = 'object'
         and not (v_size_stock ? v_item.variant_label) then
        -- A seller may have removed a size after confirmation; cancellation
        -- restores the exact ordered size rather than losing the reserved unit.
        v_variant_stock := 0;
      else
        if jsonb_typeof(v_size_stock) is distinct from 'object'
           or not (v_size_stock ? v_item.variant_label)
           or jsonb_typeof(v_size_stock -> v_item.variant_label) is distinct from 'number'
           or (v_size_stock ->> v_item.variant_label) !~ '^[0-9]+$' then
          raise exception 'product_variant_unavailable_or_insufficient_stock';
        end if;
        v_variant_stock := (v_size_stock ->> v_item.variant_label)::integer;
      end if;
    end if;

    if p_restore then
      if v_item.variant_label is null then
        update public.products
        set stock_quantity = stock_quantity + v_item.quantity,
            updated_at = now()
        where id = v_item.product_id;
      else
        update public.products
        set stock_quantity = stock_quantity + v_item.quantity,
            size_stock = jsonb_set(
              v_size_stock,
              array[v_item.variant_label],
              to_jsonb(v_variant_stock + v_item.quantity),
              true
            ),
            updated_at = now()
        where id = v_item.product_id;
      end if;
    else
      if v_stock < v_item.quantity then
        raise exception 'product_unavailable_or_insufficient_stock';
      end if;
      if v_item.variant_label is not null and v_variant_stock < v_item.quantity then
        raise exception 'product_variant_unavailable_or_insufficient_stock';
      end if;

      if v_item.variant_label is null then
        update public.products
        set stock_quantity = stock_quantity - v_item.quantity,
            updated_at = now()
        where id = v_item.product_id;
      else
        update public.products
        set stock_quantity = stock_quantity - v_item.quantity,
            size_stock = jsonb_set(
              v_size_stock,
              array[v_item.variant_label],
              to_jsonb(v_variant_stock - v_item.quantity),
              false
            ),
            updated_at = now()
        where id = v_item.product_id;
      end if;
    end if;
  end loop;
end;
$function$;

revoke all on function private.apply_order_item_stock(uuid,boolean) from public, anon, authenticated, service_role;

create or replace function public.seller_confirm_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_status public.order_status;
  v_reserved boolean;
begin
  if auth.uid() is null or not private.is_order_seller(p_order_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select status, stock_reserved into v_status, v_reserved
  from public.orders
  where id = p_order_id
  for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_status <> 'pending' then raise exception 'invalid_order_transition'; end if;
  if not exists (select 1 from public.order_items oi where oi.order_id = p_order_id)
     or (select count(distinct oi.shop_id) from public.order_items oi where oi.order_id = p_order_id) <> 1 then
    raise exception 'invalid_order_shop_scope';
  end if;

  if not v_reserved then
    perform private.apply_order_item_stock(p_order_id, false);
  end if;

  update public.orders
  set status = 'confirmed', confirmed_at = now(), stock_reserved = true, updated_at = now()
  where id = p_order_id;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
  values (auth.uid(), 'update'::public.audit_action, 'order', p_order_id,
    'Order confirmed by seller', jsonb_build_object('from', 'pending', 'to', 'confirmed'));
end;
$function$;

create or replace function public.seller_cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_status public.order_status;
  v_reserved boolean;
begin
  if auth.uid() is null or not private.is_order_seller(p_order_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select status, stock_reserved into v_status, v_reserved
  from public.orders
  where id = p_order_id
  for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_status not in ('pending', 'confirmed') then raise exception 'invalid_order_transition'; end if;
  if exists (
    select 1 from public.payments pay
    where pay.order_id = p_order_id
      and pay.status in ('pending', 'authorized', 'paid', 'partially_refunded')
  ) then
    raise exception 'payment_action_required';
  end if;
  if (select count(distinct oi.shop_id) from public.order_items oi where oi.order_id = p_order_id) <> 1 then
    raise exception 'invalid_order_shop_scope';
  end if;

  if v_reserved then
    perform private.apply_order_item_stock(p_order_id, true);
  end if;

  update public.orders
  set status = 'cancelled', cancelled_at = now(), stock_reserved = false, updated_at = now()
  where id = p_order_id;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
  values (auth.uid(), 'update'::public.audit_action, 'order', p_order_id,
    'Order cancelled by seller', jsonb_build_object('from', v_status::text, 'to', 'cancelled'));
end;
$function$;

create or replace function public.buyer_cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_buyer_id uuid;
  v_status public.order_status;
  v_reserved boolean;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select buyer_id, status, stock_reserved
    into v_buyer_id, v_status, v_reserved
  from public.orders
  where id = p_order_id
  for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_buyer_id is distinct from auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_status <> 'pending' then raise exception 'invalid_order_transition'; end if;
  if exists (
    select 1 from public.payments pay
    where pay.order_id = p_order_id
      and pay.status in ('pending', 'authorized', 'paid', 'partially_refunded')
  ) then
    raise exception 'payment_action_required';
  end if;

  if v_reserved then
    perform private.apply_order_item_stock(p_order_id, true);
  end if;

  update public.orders
  set status = 'cancelled', cancelled_at = now(), stock_reserved = false, updated_at = now()
  where id = p_order_id;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
  values (auth.uid(), 'update'::public.audit_action, 'order', p_order_id,
    'Order cancelled by buyer', jsonb_build_object('from', 'pending', 'to', 'cancelled'));
end;
$function$;

revoke all on function public.seller_confirm_order(uuid) from public, anon;
revoke all on function public.seller_cancel_order(uuid) from public, anon;
revoke all on function public.buyer_cancel_order(uuid) from public, anon;
grant execute on function public.seller_confirm_order(uuid) to authenticated;
grant execute on function public.seller_cancel_order(uuid) to authenticated;
grant execute on function public.buyer_cancel_order(uuid) to authenticated;
