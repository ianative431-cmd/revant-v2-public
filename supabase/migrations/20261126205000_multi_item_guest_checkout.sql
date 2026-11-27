-- Multi-item guest checkout: one order per shop, atomically validated as a complete cart.
-- Existing single-item RPC signatures remain untouched for backward compatibility.

create or replace function private.create_guest_order_batch_impl(
  p_items jsonb,
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
  v_items jsonb;
  v_existing_items jsonb;
  v_item_count integer;
  v_found_count integer;
  v_buyer_id uuid := case
    when (select auth.jwt() ->> 'role') = 'service_role' then p_buyer_id
    else (select auth.uid())
  end;
  v_phone text;
  v_recent_orders integer;
  v_existing record;
  v_line record;
  v_shop record;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric;
  v_currency text;
begin
  if p_idempotency_key is null
     or coalesce(trim(p_website), '') <> ''
     or jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) < 1
     or jsonb_array_length(p_items) > 20 then
    raise exception 'invalid request';
  end if;

  if p_guest_name is null or length(trim(p_guest_name)) < 2 or length(trim(p_guest_name)) > 100
     or p_guest_phone is null or length(trim(p_guest_phone)) < 8 or length(trim(p_guest_phone)) > 24
     or p_guest_phone ~ '[^0-9+() .-]'
     or length(regexp_replace(trim(p_guest_phone), '[^0-9]', '', 'g')) < 8
     or length(regexp_replace(trim(p_guest_phone), '[^0-9]', '', 'g')) > 15
     or p_guest_city is null or length(trim(p_guest_city)) < 2 or length(trim(p_guest_city)) > 100
     or p_guest_address is null or length(trim(p_guest_address)) < 5 or length(trim(p_guest_address)) > 300
     or p_tracking_token_hash is null or p_tracking_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid request';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as e(value)
    where jsonb_typeof(e.value) is distinct from 'object'
       or not (e.value ? 'product_id')
       or not (e.value ? 'quantity')
       or jsonb_typeof(e.value -> 'product_id') is distinct from 'string'
       or jsonb_typeof(e.value -> 'quantity') is distinct from 'number'
       or (e.value ->> 'quantity') !~ '^[0-9]+$'
       or (e.value ->> 'quantity')::integer not between 1 and 99
       or (e.value ? 'variant_label' and jsonb_typeof(e.value -> 'variant_label') not in ('string', 'null'))
       or length(coalesce(nullif(btrim(e.value ->> 'variant_label'), ''), '')) > 50
  ) then
    raise exception 'invalid request';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'product_id', x.product_id::text,
      'quantity', x.quantity,
      'variant_label', nullif(btrim(x.variant_label), '')
    )
    order by x.product_id, coalesce(nullif(btrim(x.variant_label), ''), '')
  )
  into v_items
  from jsonb_to_recordset(p_items) as x(
    product_id uuid,
    quantity integer,
    variant_label text
  );

  select count(*)::integer into v_item_count
  from jsonb_to_recordset(v_items) as x(
    product_id uuid,
    quantity integer,
    variant_label text
  );

  if v_item_count <> jsonb_array_length(p_items)
     or exists (
       select 1
       from jsonb_to_recordset(v_items) as x(
         product_id uuid,
         quantity integer,
         variant_label text
       )
       group by x.product_id, coalesce(x.variant_label, '')
       having count(*) > 1
     ) then
    raise exception 'invalid request';
  end if;

  if v_buyer_id is not null and not exists (
    select 1 from auth.users u where u.id = v_buyer_id
  ) then
    raise exception 'invalid request';
  end if;

  v_phone := regexp_replace(trim(p_guest_phone), '[^0-9]', '', 'g');

  -- Serialize retries before comparing the entire normalized cart and buyer details.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  select
    o.id,
    o.order_number,
    o.buyer_id,
    o.guest_phone,
    o.guest_name,
    o.guest_city,
    o.guest_address,
    o.guest_tracking_token_hash
  into v_existing
  from public.orders o
  where o.idempotency_key = p_idempotency_key
  limit 1;

  if found then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'product_id', oi.product_id::text,
          'quantity', oi.quantity,
          'variant_label', oi.variant_label
        )
        order by oi.product_id, coalesce(oi.variant_label, '')
      ),
      '[]'::jsonb
    )
    into v_existing_items
    from public.order_items oi
    where oi.order_id = v_existing.id;

    if v_existing_items is distinct from v_items
       or v_existing.buyer_id is distinct from v_buyer_id
       or v_existing.guest_phone is distinct from v_phone
       or v_existing.guest_name is distinct from trim(p_guest_name)
       or v_existing.guest_city is distinct from trim(p_guest_city)
       or v_existing.guest_address is distinct from trim(p_guest_address)
       or v_existing.guest_tracking_token_hash is distinct from p_tracking_token_hash then
      raise exception 'idempotency_conflict';
    end if;

    return jsonb_build_object('order_id', v_existing.id, 'order_number', v_existing.order_number);
  end if;

  select count(*)::integer into v_recent_orders
  from public.orders o
  where o.guest_phone = v_phone
    and o.created_at > now() - interval '1 hour';
  if v_recent_orders >= 3 then
    raise exception 'rate limit exceeded';
  end if;

  -- Lock all distinct product rows in a stable order to avoid lock-order deadlocks.
  perform p.id
  from public.products p
  join (
    select distinct x.product_id
    from jsonb_to_recordset(v_items) as x(
      product_id uuid,
      quantity integer,
      variant_label text
    )
  ) requested on requested.product_id = p.id
  order by p.id
  for update of p;

  select count(*)::integer into v_found_count
  from jsonb_to_recordset(v_items) as x(
    product_id uuid,
    quantity integer,
    variant_label text
  )
  join public.products p on p.id = x.product_id
  join public.shops s on s.id = p.shop_id
  where p.status = 'active' and s.status = 'active';

  if v_found_count <> v_item_count then
    raise exception 'product unavailable';
  end if;

  if (
    select count(distinct p.shop_id)
    from jsonb_to_recordset(v_items) as x(
      product_id uuid,
      quantity integer,
      variant_label text
    )
    join public.products p on p.id = x.product_id
    join public.shops s on s.id = p.shop_id
    where p.status = 'active' and s.status = 'active'
  ) <> 1 then
    raise exception 'mixed_shop_order';
  end if;

  if (
    select count(distinct p.currency::text)
    from jsonb_to_recordset(v_items) as x(
      product_id uuid,
      quantity integer,
      variant_label text
    )
    join public.products p on p.id = x.product_id
  ) <> 1 then
    raise exception 'mixed_currency_order';
  end if;

  if exists (
    select 1
    from (
      select x.product_id, sum(x.quantity)::integer as requested_quantity
      from jsonb_to_recordset(v_items) as x(
        product_id uuid,
        quantity integer,
        variant_label text
      )
      group by x.product_id
    ) requested
    join public.products p on p.id = requested.product_id
    where p.stock_quantity < requested.requested_quantity
  ) then
    raise exception 'product unavailable';
  end if;

  for v_line in
    select
      x.product_id,
      x.quantity,
      nullif(btrim(x.variant_label), '') as variant_label,
      p.product_type,
      coalesce(p.size_stock, '{}'::jsonb) as size_stock,
      p.shop_id,
      s.owner_id
    from jsonb_to_recordset(v_items) as x(
      product_id uuid,
      quantity integer,
      variant_label text
    )
    join public.products p on p.id = x.product_id
    join public.shops s on s.id = p.shop_id
    order by p.id, coalesce(nullif(btrim(x.variant_label), ''), '')
  loop
    if v_buyer_id is not null and v_line.owner_id = v_buyer_id then
      raise exception 'cannot order own product';
    end if;

    if v_line.product_type = 'clothing'
       and jsonb_typeof(v_line.size_stock) = 'object'
       and v_line.size_stock <> '{}'::jsonb then
      if v_line.variant_label is null then
        raise exception 'variant_required';
      end if;
      if not (v_line.size_stock ? v_line.variant_label)
         or jsonb_typeof(v_line.size_stock -> v_line.variant_label) is distinct from 'number'
         or (v_line.size_stock ->> v_line.variant_label) !~ '^[0-9]+$'
         or (v_line.size_stock ->> v_line.variant_label)::integer < v_line.quantity then
        raise exception 'product_variant_unavailable_or_insufficient_stock';
      end if;
    elsif v_line.variant_label is not null then
      raise exception 'invalid_product_variant';
    end if;
  end loop;

  select
    s.id,
    s.name,
    s.city,
    s.phone
  into v_shop
  from public.shops s
  join public.products p on p.shop_id = s.id
  join jsonb_to_recordset(v_items) as x(
    product_id uuid,
    quantity integer,
    variant_label text
  ) on x.product_id = p.id
  limit 1;

  select
    sum(p.base_price * x.quantity),
    min(p.currency::text)
  into v_subtotal, v_currency
  from jsonb_to_recordset(v_items) as x(
    product_id uuid,
    quantity integer,
    variant_label text
  )
  join public.products p on p.id = x.product_id;

  v_order_number := 'RVT-' || upper(to_char(clock_timestamp(), 'YYMMDDHH24MISS')) || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (
    buyer_id, order_number, status, currency, subtotal, delivery_fee, total_amount, placed_at,
    guest_name, guest_phone, guest_city, guest_address, guest_tracking_token_hash,
    idempotency_key, stock_reserved
  ) values (
    v_buyer_id, v_order_number, 'pending', v_currency, v_subtotal, 0, v_subtotal, now(),
    trim(p_guest_name), v_phone, trim(p_guest_city), trim(p_guest_address),
    p_tracking_token_hash, p_idempotency_key, false
  ) returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, shop_id, product_name, variant_label,
    quantity, unit_price, line_total, currency
  )
  select
    v_order_id,
    p.id,
    p.shop_id,
    p.name,
    nullif(btrim(x.variant_label), ''),
    x.quantity,
    p.base_price,
    p.base_price * x.quantity,
    p.currency
  from jsonb_to_recordset(v_items) as x(
    product_id uuid,
    quantity integer,
    variant_label text
  )
  join public.products p on p.id = x.product_id
  order by p.id, coalesce(nullif(btrim(x.variant_label), ''), '');

  insert into public.deliveries(order_id, status, delivery_address, pickup_address)
  values (
    v_order_id,
    'unassigned',
    concat_ws(' · ', trim(p_guest_name), v_phone, trim(p_guest_address), trim(p_guest_city)),
    concat_ws(' · ', v_shop.name, v_shop.city, v_shop.phone)
  );

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
end;
$function$;

create or replace function public.create_guest_order_batch(
  p_items jsonb,
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
  return private.create_guest_order_batch_impl(
    p_items, p_guest_name, p_guest_phone, p_guest_city, p_guest_address,
    p_tracking_token_hash, p_website, p_idempotency_key, p_buyer_id
  );
end;
$function$;

revoke all on function private.create_guest_order_batch_impl(jsonb,text,text,text,text,text,text,uuid,uuid)
  from public, anon, authenticated, service_role;
grant execute on function private.create_guest_order_batch_impl(jsonb,text,text,text,text,text,text,uuid,uuid)
  to service_role;
revoke all on function public.create_guest_order_batch(jsonb,text,text,text,text,text,text,uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.create_guest_order_batch(jsonb,text,text,text,text,text,text,uuid,uuid)
  to service_role;

-- Return every line in the private guest confirmation payload, not an arbitrary first row.
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
    'product_name', (
      select oi.product_name
      from public.order_items oi
      where oi.order_id = o.id
      order by oi.product_id, coalesce(oi.variant_label, '')
      limit 1
    ),
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'product_name', oi.product_name,
          'variant_label', oi.variant_label,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'line_total', oi.line_total,
          'currency', btrim(oi.currency::text)
        )
        order by oi.product_id, coalesce(oi.variant_label, '')
      )
      from public.order_items oi
      where oi.order_id = o.id
    ), '[]'::jsonb),
    'shop_name', (
      select s.name
      from public.order_items oi
      join public.shops s on s.id = oi.shop_id
      where oi.order_id = o.id
      order by oi.product_id, coalesce(oi.variant_label, '')
      limit 1
    ),
    'created_at', o.created_at,
    'delivery_status', d.status::text,
    'delivery_code_ciphertext', cs.code_ciphertext,
    'delivery_code_hint', cs.code_hint
  )
  into v_result
  from public.orders o
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
