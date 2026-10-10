-- Guest checkout: buyers may order without creating an account.
-- The public site calls this RPC only from a server action using service_role.
ALTER TABLE public.orders
  ALTER COLUMN buyer_id DROP NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS guest_city text,
  ADD COLUMN IF NOT EXISTS guest_address text;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_buyer_or_guest_contact
  CHECK (
    buyer_id IS NOT NULL OR (
      guest_name IS NOT NULL AND length(trim(guest_name)) BETWEEN 2 AND 120
      AND guest_phone IS NOT NULL AND length(trim(guest_phone)) BETWEEN 8 AND 24
      AND guest_city IS NOT NULL AND length(trim(guest_city)) BETWEEN 2 AND 120
      AND guest_address IS NOT NULL AND length(trim(guest_address)) BETWEEN 4 AND 240
    )
  ) NOT VALID;

ALTER TABLE public.orders VALIDATE CONSTRAINT orders_buyer_or_guest_contact;

CREATE OR REPLACE FUNCTION public.create_guest_order(
  p_product_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_guest_city text,
  p_guest_address text
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
BEGIN
  IF length(trim(coalesce(p_guest_name, ''))) NOT BETWEEN 2 AND 120
     OR length(trim(coalesce(p_guest_phone, ''))) NOT BETWEEN 8 AND 24
     OR trim(p_guest_phone) !~ '^[+0-9][0-9 +().-]{7,23}$'
     OR length(trim(coalesce(p_guest_city, ''))) NOT BETWEEN 2 AND 120
     OR length(trim(coalesce(p_guest_address, ''))) NOT BETWEEN 4 AND 240 THEN
    RAISE EXCEPTION 'invalid_guest_details';
  END IF;

  SELECT p.id, p.name, p.base_price, p.currency, p.stock_quantity,
         p.status::text AS status, p.shop_id, s.name AS shop_name
    INTO v_product
    FROM public.products p
    JOIN public.shops s ON s.id = p.shop_id
   WHERE p.id = p_product_id
   FOR UPDATE OF p;

  IF NOT FOUND OR v_product.status <> 'active' OR v_product.stock_quantity <= 0 THEN
    RAISE EXCEPTION 'product_unavailable';
  END IF;

  v_order_number := 'RVT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  INSERT INTO public.orders (
    buyer_id, order_number, status, subtotal, delivery_fee, total_amount,
    currency, placed_at, guest_name, guest_phone, guest_city, guest_address
  ) VALUES (
    NULL, v_order_number, 'pending', v_product.base_price, 0, v_product.base_price,
    v_product.currency, now(), trim(p_guest_name), trim(p_guest_phone),
    trim(p_guest_city), trim(p_guest_address)
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, shop_id, product_name, quantity,
    unit_price, line_total, currency
  ) VALUES (
    v_order_id, v_product.id, v_product.shop_id, v_product.name, 1,
    v_product.base_price, v_product.base_price, v_product.currency
  );

  RETURN jsonb_build_object(
    'order_number', v_order_number,
    'total_amount', v_product.base_price,
    'currency', v_product.currency
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.create_guest_order(uuid, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_guest_order(uuid, text, text, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_guest_order(uuid, text, text, text, text) TO service_role;

COMMENT ON FUNCTION public.create_guest_order(uuid, text, text, text, text) IS
  'Creates a guest order atomically. Callable only by the server service-role client; validates contact data and reloads product price/status/stock from the database.';
