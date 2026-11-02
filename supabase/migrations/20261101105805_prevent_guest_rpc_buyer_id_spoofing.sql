create or replace function private.create_guest_order_impl(
  p_product_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_guest_city text,
  p_guest_address text,
  p_tracking_token_hash text,
  p_website text,
  p_buyer_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_product record;
  v_order_id uuid;
  v_order_number text;
  v_phone text;
  -- Only the trusted service-role path may provide a buyer ID. All
  -- anon/authenticated calls derive it from the signed-in JWT.
  v_buyer_id uuid := case
    when (select auth.role()) = 'service_role' then p_buyer_id
    else (select auth.uid())
  end;
  v_recent_orders integer;
begin
  if coalesce(trim(p_website), '') <> '' then raise exception 'invalid request'; end if;
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
  if v_buyer_id is not null and not exists (select 1 from auth.users u where u.id=v_buyer_id) then
    raise exception 'invalid request';
  end if;
  v_phone := regexp_replace(trim(p_guest_phone), '[^0-9+]', '', 'g');
  select count(*)::integer into v_recent_orders from public.orders o
  where o.guest_phone=v_phone and o.created_at>now()-interval '1 hour';
  if v_recent_orders>=3 then raise exception 'rate limit exceeded'; end if;
  select p.id,p.name,p.base_price,p.currency,p.stock_quantity,p.shop_id,s.owner_id
    into v_product
  from public.products p join public.shops s on s.id=p.shop_id
  where p.id=p_product_id and p.status='active' and p.stock_quantity>0 and s.status='active'
  for update of p;
  if not found then raise exception 'product unavailable'; end if;
  if v_buyer_id is not null and v_product.owner_id=v_buyer_id then raise exception 'cannot order own product'; end if;
  v_order_number := 'RVT-' || upper(to_char(clock_timestamp(),'YYMMDDHH24MISS')) || '-' ||
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.orders (
    buyer_id,order_number,status,currency,subtotal,delivery_fee,total_amount,placed_at,
    guest_name,guest_phone,guest_city,guest_address,guest_tracking_token_hash
  ) values (
    v_buyer_id,v_order_number,'pending',v_product.currency,v_product.base_price,0,v_product.base_price,now(),
    trim(p_guest_name),v_phone,trim(p_guest_city),trim(p_guest_address),p_tracking_token_hash
  ) returning id into v_order_id;
  insert into public.order_items (
    order_id,product_id,shop_id,product_name,quantity,unit_price,line_total,currency
  ) values (
    v_order_id,v_product.id,v_product.shop_id,v_product.name,1,v_product.base_price,v_product.base_price,v_product.currency
  );
  return jsonb_build_object('order_id',v_order_id,'order_number',v_order_number);
end;
$function$;
