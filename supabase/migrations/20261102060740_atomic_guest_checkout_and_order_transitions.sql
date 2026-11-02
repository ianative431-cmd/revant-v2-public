-- Atomic guest checkout, idempotency, inventory reservation and guarded order transitions.
-- Applied to the Revant Supabase project as migration version 20261102060740.

alter table public.orders
  add column if not exists idempotency_key uuid,
  add column if not exists confirmed_at timestamptz,
  add column if not exists stock_reserved boolean not null default false;

create unique index if not exists orders_idempotency_key_unique
  on public.orders (idempotency_key)
  where idempotency_key is not null;

comment on column public.orders.idempotency_key is
  'Unique key for a single checkout submission; prevents duplicate orders on retries.';
comment on column public.orders.stock_reserved is
  'True when seller confirmation has deducted quantities from available stock and cancellation may restore them.';

-- Orders and their lines are written only through trusted server-side RPCs.
-- Sellers and buyers retain SELECT access through RLS, not direct table writes.
drop policy if exists "sellers update orders containing their items" on public.orders;
revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;

-- Replace the earlier guest RPC signature so every server-created order has an idempotency key.
drop function if exists public.create_guest_order(uuid,text,text,text,text,text,text,uuid);
drop function if exists private.create_guest_order_impl(uuid,text,text,text,text,text,text,uuid);

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
begin
  if p_idempotency_key is null
     or coalesce(trim(p_website), '') <> '' then
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

  -- Serialize repeated submissions using the same key before checking the existing order.
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
    oi.product_id
  into v_existing
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  where o.idempotency_key = p_idempotency_key
  limit 1;

  if found then
    if v_existing.product_id is distinct from p_product_id
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

  select p.id, p.name, p.base_price, p.currency, p.stock_quantity, p.shop_id,
    s.owner_id, s.name as shop_name, s.city as shop_city, s.phone as shop_phone
    into v_product
  from public.products p
  join public.shops s on s.id = p.shop_id
  where p.id = p_product_id
    and p.status = 'active'
    and p.stock_quantity > 0
    and s.status = 'active'
  for update of p;

  if not found then
    raise exception 'product unavailable';
  end if;
  if v_buyer_id is not null and v_product.owner_id = v_buyer_id then
    raise exception 'cannot order own product';
  end if;

  -- The row lock validates current availability. Inventory is reserved only
  -- when the seller accepts the order, avoiding abandoned pending orders
  -- holding stock indefinitely.

  v_order_number := 'RVT-' || upper(to_char(clock_timestamp(), 'YYMMDDHH24MISS')) || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (
    buyer_id, order_number, status, currency, subtotal, delivery_fee, total_amount, placed_at,
    guest_name, guest_phone, guest_city, guest_address, guest_tracking_token_hash,
    idempotency_key, stock_reserved
  ) values (
    v_buyer_id, v_order_number, 'pending', v_product.currency, v_product.base_price, 0,
    v_product.base_price, now(), trim(p_guest_name), v_phone, trim(p_guest_city),
    trim(p_guest_address), p_tracking_token_hash, p_idempotency_key, false
  ) returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, shop_id, product_name, quantity, unit_price, line_total, currency
  ) values (
    v_order_id, v_product.id, v_product.shop_id, v_product.name, 1,
    v_product.base_price, v_product.base_price, v_product.currency
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
    p_product_id, p_guest_name, p_guest_phone, p_guest_city,
    p_guest_address, p_tracking_token_hash, p_website,
    p_idempotency_key, p_buyer_id
  );
end;
$function$;

revoke all on function private.create_guest_order_impl(uuid,text,text,text,text,text,text,uuid,uuid) from public, anon, authenticated;
grant execute on function private.create_guest_order_impl(uuid,text,text,text,text,text,text,uuid,uuid) to service_role;
revoke all on function public.create_guest_order(uuid,text,text,text,text,text,text,uuid,uuid) from public, anon, authenticated;
grant execute on function public.create_guest_order(uuid,text,text,text,text,text,text,uuid,uuid) to service_role;

-- Guest tracking lookups are server-only; the server component calls them with service_role.
revoke all on function private.get_guest_order_impl(text,text) from public, anon, authenticated;
grant execute on function private.get_guest_order_impl(text,text) to service_role;
revoke all on function public.get_guest_order(text,text) from public, anon, authenticated;
grant execute on function public.get_guest_order(text,text) to service_role;

-- Authenticated clients may not update orders directly through PostgREST.
-- This blocks changes to status, price, buyer, idempotency and guest tracking fields.
-- Only SECURITY DEFINER transition functions and trusted server integrations may write.
create or replace function private.guard_order_status_writes()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception 'order_updates_server_only' using errcode = '42501';
  end if;
  return new;
end;
$function$;

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
    -- Lock every product in stable order, then validate the live stock again.
    perform p.id
    from public.products p
    join public.order_items oi on oi.product_id = p.id
    where oi.order_id = p_order_id
    order by p.id
    for update of p;

    if exists (
      select 1
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      join public.shops s on s.id = oi.shop_id
      where oi.order_id = p_order_id
        and (p.status <> 'active' or s.status <> 'active' or p.stock_quantity < oi.quantity)
    ) then
      raise exception 'product_unavailable_or_insufficient_stock';
    end if;

    update public.products p
    set stock_quantity = p.stock_quantity - oi.quantity,
        updated_at = now()
    from public.order_items oi
    where oi.order_id = p_order_id and oi.product_id = p.id;
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

  update public.orders
  set status = 'cancelled', cancelled_at = now(), stock_reserved = false, updated_at = now()
  where id = p_order_id;

  if v_reserved then
    update public.products p
    set stock_quantity = p.stock_quantity + oi.quantity,
        updated_at = now()
    from public.order_items oi
    where oi.order_id = p_order_id and oi.product_id = p.id;
  end if;

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
  if auth.uid() is null then raise exception 'forbidden' using errcode = '42501'; end if;

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

  update public.orders
  set status = 'cancelled', cancelled_at = now(), stock_reserved = false, updated_at = now()
  where id = p_order_id;

  if v_reserved then
    update public.products p
    set stock_quantity = p.stock_quantity + oi.quantity,
        updated_at = now()
    from public.order_items oi
    where oi.order_id = p_order_id and oi.product_id = p.id;
  end if;

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
