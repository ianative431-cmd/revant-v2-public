-- Allow guest checkout to request a quantity greater than one.
-- The existing single-item RPC remains available for older clients.
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
security definer
set search_path = ''
as $function$
declare
  v_result jsonb;
  v_order_id uuid;
  v_existing_quantity integer;
  v_stock integer;
  v_unit_price numeric;
  v_existing boolean := false;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 99 then
    raise exception 'invalid quantity';
  end if;

  if p_idempotency_key is null then
    raise exception 'invalid request';
  end if;

  -- Serialize requests sharing the same idempotency key.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  select oi.quantity
    into v_existing_quantity
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  where o.idempotency_key = p_idempotency_key
    and oi.product_id = p_product_id
  limit 1;
  v_existing := found;

  if v_existing and v_existing_quantity <> p_quantity then
    raise exception 'idempotency_conflict';
  end if;

  if not v_existing then
    select p.stock_quantity
      into v_stock
    from public.products p
    join public.shops s on s.id = p.shop_id
    where p.id = p_product_id
      and p.status = 'active'
      and s.status = 'active'
    for update of p;

    if not found or v_stock < p_quantity then
      raise exception 'product unavailable';
    end if;
  end if;

  -- The original implementation validates the guest details, honeypot,
  -- buyer identity, product ownership, product state and all idempotency
  -- fields, and creates the order atomically.
  v_result := private.create_guest_order_impl(
    p_product_id,
    p_guest_name,
    p_guest_phone,
    p_guest_city,
    p_guest_address,
    p_tracking_token_hash,
    p_website,
    p_idempotency_key,
    p_buyer_id
  );

  v_order_id := (v_result ->> 'order_id')::uuid;

  if not v_existing then
    select oi.unit_price
      into v_unit_price
    from public.order_items oi
    where oi.order_id = v_order_id
      and oi.product_id = p_product_id
    for update;

    if not found then
      raise exception 'order item missing';
    end if;

    update public.order_items
      set quantity = p_quantity,
          line_total = v_unit_price * p_quantity
      where order_id = v_order_id
        and product_id = p_product_id;

    update public.orders
      set subtotal = v_unit_price * p_quantity,
          total_amount = v_unit_price * p_quantity
      where id = v_order_id;
  end if;

  return v_result;
end;
$function$;

revoke all on function public.create_guest_order(uuid, text, text, text, text, text, text, uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.create_guest_order(uuid, text, text, text, text, text, text, uuid, uuid, integer) to service_role;
