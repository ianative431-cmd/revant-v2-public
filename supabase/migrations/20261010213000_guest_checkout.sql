-- Guest checkout: allow orders without an account, while keeping table access private.
ALTER TABLE public.orders ALTER COLUMN buyer_id DROP NOT NULL;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS guest_city text,
  ADD COLUMN IF NOT EXISTS guest_address text,
  ADD COLUMN IF NOT EXISTS guest_tracking_token_hash text;

CREATE INDEX IF NOT EXISTS orders_guest_phone_created_at_idx
  ON public.orders (guest_phone, created_at DESC)
  WHERE guest_phone IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_guest_order(
  p_product_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_guest_city text,
  p_guest_address text,
  p_tracking_token_hash text,
  p_website text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_product record;
  v_order_id uuid;
  v_order_number text;
  v_phone text;
  v_buyer_id uuid := auth.uid();
  v_recent_orders integer;
BEGIN
  IF coalesce(trim(p_website), '') <> '' THEN
    RAISE EXCEPTION 'invalid request';
  END IF;

  IF p_guest_name IS NULL OR length(trim(p_guest_name)) < 2 OR length(trim(p_guest_name)) > 100
     OR p_guest_phone IS NULL OR length(trim(p_guest_phone)) < 8 OR length(trim(p_guest_phone)) > 24
     OR trim(p_guest_phone) !~ '^[0-9+() .-]+$'
     OR p_guest_city IS NULL OR length(trim(p_guest_city)) < 2 OR length(trim(p_guest_city)) > 100
     OR p_guest_address IS NULL OR length(trim(p_guest_address)) < 5 OR length(trim(p_guest_address)) > 300
     OR p_tracking_token_hash IS NULL OR p_tracking_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid request';
  END IF;

  v_phone := regexp_replace(trim(p_guest_phone), '[^0-9+]', '', 'g');
  SELECT count(*)::integer INTO v_recent_orders
  FROM public.orders o
  WHERE o.guest_phone = v_phone
    AND o.created_at > now() - interval '1 hour';
  IF v_recent_orders >= 3 THEN
    RAISE EXCEPTION 'rate limit exceeded';
  END IF;

  SELECT p.id, p.name, p.base_price, p.currency, p.stock_quantity, p.shop_id, s.owner_id
    INTO v_product
  FROM public.products p
  JOIN public.shops s ON s.id = p.shop_id
  WHERE p.id = p_product_id
    AND p.status = 'active'
    AND p.stock_quantity > 0
    AND s.status = 'active'
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product unavailable';
  END IF;
  IF v_buyer_id IS NOT NULL AND v_product.owner_id = v_buyer_id THEN
    RAISE EXCEPTION 'cannot order own product';
  END IF;

  v_order_number := 'RVT-' || upper(to_char(clock_timestamp(), 'YYMMDDHH24MISS')) || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.orders (
    buyer_id, order_number, status, currency, subtotal, delivery_fee, total_amount, placed_at,
    guest_name, guest_phone, guest_city, guest_address, guest_tracking_token_hash
  ) VALUES (
    v_buyer_id, v_order_number, 'pending', v_product.currency, v_product.base_price, 0, v_product.base_price, now(),
    trim(p_guest_name), v_phone, trim(p_guest_city), trim(p_guest_address), p_tracking_token_hash
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, shop_id, product_name, quantity, unit_price, line_total, currency
  ) VALUES (
    v_order_id, v_product.id, v_product.shop_id, v_product.name, 1, v_product.base_price, v_product.base_price, v_product.currency
  );

  RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_guest_order(
  p_order_number text,
  p_tracking_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  IF p_order_number IS NULL OR p_tracking_token_hash IS NULL OR p_tracking_token_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'order_number', o.order_number,
    'status', o.status::text,
    'total_amount', o.total_amount,
    'currency', btrim(o.currency::text),
    'product_name', oi.product_name,
    'shop_name', s.name,
    'created_at', o.created_at
  )
  INTO v_result
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.shops s ON s.id = oi.shop_id
  WHERE o.order_number = p_order_number
    AND o.guest_tracking_token_hash = p_tracking_token_hash
  LIMIT 1;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_guest_order(uuid, text, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_guest_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_order(uuid, text, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_order(text, text) TO anon, authenticated;
