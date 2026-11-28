-- Disposable CI-only schema harness aligned with the live Supabase checkout schema.
-- No Supabase project or production data is accessed.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;

CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','processing','ready_for_delivery','shipped','delivered','cancelled','refunded','disputed');
CREATE TYPE public.product_status AS ENUM ('draft','pending','active','rejected','archived');
CREATE TYPE public.shop_status AS ENUM ('draft','pending','active','suspended','closed');
CREATE TYPE public.delivery_status AS ENUM ('unassigned','assigned','picked_up','in_transit','delivered','failed','cancelled');

CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)
$$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(auth.jwt()->>'sub','')::uuid
$$;

CREATE TABLE public.profiles (id uuid PRIMARY KEY);
CREATE TABLE public.shops (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES public.profiles(id), slug text NOT NULL UNIQUE,
 name text NOT NULL, city text, phone text, status public.shop_status NOT NULL DEFAULT 'draft'
);
CREATE TABLE public.products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), shop_id uuid NOT NULL REFERENCES public.shops(id),
 name text NOT NULL, slug text NOT NULL, status public.product_status NOT NULL DEFAULT 'draft',
 base_price numeric NOT NULL DEFAULT 0 CHECK (base_price >= 0),
 currency character(3) NOT NULL DEFAULT 'XOF',
 stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 product_type text NOT NULL DEFAULT 'other' CHECK (product_type IN ('clothing','perfume','other')),
 size_stock jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(size_stock)='object'),
 UNIQUE(shop_id,slug)
);
CREATE TABLE public.orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 buyer_id uuid REFERENCES public.profiles(id),
 order_number text NOT NULL UNIQUE,
 status public.order_status NOT NULL DEFAULT 'pending',
 subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
 delivery_fee numeric NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
 total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
 currency character(3) NOT NULL DEFAULT 'XOF',
 placed_at timestamptz,
 confirmed_at timestamptz, cancelled_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(),
 guest_name text, guest_phone text, guest_city text, guest_address text,
 guest_tracking_token_hash text,
 idempotency_key uuid UNIQUE,
 stock_reserved boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
 product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
 shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
 product_name text NOT NULL,
 quantity integer NOT NULL CHECK (quantity > 0),
 unit_price numeric NOT NULL CHECK (unit_price >= 0),
 line_total numeric NOT NULL CHECK (line_total >= 0),
 currency character(3) NOT NULL DEFAULT 'XOF',
 variant_label text CHECK (variant_label IS NULL OR (length(btrim(variant_label)) BETWEEN 1 AND 50)),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
 driver_id uuid, company_id uuid,
 status public.delivery_status NOT NULL DEFAULT 'unassigned',
 pickup_address text, delivery_address text,
 assigned_at timestamptz, picked_up_at timestamptz, delivered_at timestamptz,
 failure_reason text, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), proof_photo_url text,
 claim_expires_at timestamptz, requested_at timestamptz
);
CREATE TABLE private.delivery_code_secrets (
 delivery_id uuid PRIMARY KEY REFERENCES public.deliveries(id),
 code_ciphertext text, code_hint text
);
CREATE FUNCTION private.get_guest_order_impl(text,text) RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;

GRANT USAGE ON SCHEMA public,private,auth TO anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON auth.users TO service_role;


-- Minimal production-shaped order lifecycle functions for CI stock reservation tests.
CREATE TYPE public.audit_action AS ENUM ('create','update','delete');
CREATE TABLE public.audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid,
 action public.audit_action NOT NULL, entity_type text NOT NULL, entity_id uuid NOT NULL,
 description text NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE public.payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.orders(id), status text NOT NULL
);

CREATE OR REPLACE FUNCTION private.is_order_seller(p_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
 SELECT EXISTS (
   SELECT 1 FROM public.order_items oi JOIN public.shops s ON s.id=oi.shop_id
   WHERE oi.order_id=p_order_id AND s.owner_id=(SELECT auth.uid())
 )
$function$;

CREATE OR REPLACE FUNCTION private.apply_order_item_stock(p_order_id uuid, p_restore boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
 v_item record; v_stock integer; v_size_stock jsonb; v_variant_stock integer;
 v_product_status text; v_shop_status text;
BEGIN
 FOR v_item IN
   SELECT oi.id,oi.product_id,oi.quantity,oi.variant_label
   FROM public.order_items oi WHERE oi.order_id=p_order_id
   ORDER BY oi.product_id,oi.variant_label NULLS FIRST,oi.id
 LOOP
   SELECT p.stock_quantity,COALESCE(p.size_stock,'{}'::jsonb),p.status::text,s.status::text
   INTO v_stock,v_size_stock,v_product_status,v_shop_status
   FROM public.products p JOIN public.shops s ON s.id=p.shop_id
   WHERE p.id=v_item.product_id FOR UPDATE OF p;
   IF NOT FOUND THEN RAISE EXCEPTION 'product unavailable'; END IF;
   IF NOT p_restore AND (v_product_status<>'active' OR v_shop_status<>'active') THEN
     RAISE EXCEPTION 'product_unavailable_or_insufficient_stock';
   END IF;
   v_variant_stock:=NULL;
   IF v_item.variant_label IS NOT NULL THEN
     IF p_restore AND jsonb_typeof(v_size_stock)='object' AND NOT (v_size_stock ? v_item.variant_label) THEN
       v_variant_stock:=0;
     ELSE
       IF jsonb_typeof(v_size_stock) IS DISTINCT FROM 'object'
          OR NOT (v_size_stock ? v_item.variant_label)
          OR jsonb_typeof(v_size_stock -> v_item.variant_label) IS DISTINCT FROM 'number'
          OR (v_size_stock ->> v_item.variant_label) !~ '^[0-9]+$' THEN
         RAISE EXCEPTION 'product_variant_unavailable_or_insufficient_stock';
       END IF;
       v_variant_stock:=(v_size_stock ->> v_item.variant_label)::integer;
     END IF;
   END IF;
   IF p_restore THEN
     IF v_item.variant_label IS NULL THEN
       UPDATE public.products SET stock_quantity=stock_quantity+v_item.quantity,updated_at=now() WHERE id=v_item.product_id;
     ELSE
       UPDATE public.products SET stock_quantity=stock_quantity+v_item.quantity,
         size_stock=jsonb_set(v_size_stock,array[v_item.variant_label],to_jsonb(v_variant_stock+v_item.quantity),true),
         updated_at=now() WHERE id=v_item.product_id;
     END IF;
   ELSE
     IF v_stock<v_item.quantity THEN RAISE EXCEPTION 'product_unavailable_or_insufficient_stock'; END IF;
     IF v_item.variant_label IS NOT NULL AND v_variant_stock<v_item.quantity THEN
       RAISE EXCEPTION 'product_variant_unavailable_or_insufficient_stock';
     END IF;
     IF v_item.variant_label IS NULL THEN
       UPDATE public.products SET stock_quantity=stock_quantity-v_item.quantity,updated_at=now() WHERE id=v_item.product_id;
     ELSE
       UPDATE public.products SET stock_quantity=stock_quantity-v_item.quantity,
         size_stock=jsonb_set(v_size_stock,array[v_item.variant_label],to_jsonb(v_variant_stock-v_item.quantity),false),
         updated_at=now() WHERE id=v_item.product_id;
     END IF;
   END IF;
 END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.seller_confirm_order(p_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_status public.order_status; v_reserved boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT private.is_order_seller(p_order_id) THEN
   RAISE EXCEPTION 'forbidden' USING errcode='42501';
 END IF;
 SELECT status,stock_reserved INTO v_status,v_reserved FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
 IF v_status<>'pending' THEN RAISE EXCEPTION 'invalid_order_transition'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id=p_order_id)
    OR (SELECT count(DISTINCT oi.shop_id) FROM public.order_items oi WHERE oi.order_id=p_order_id)<>1 THEN
   RAISE EXCEPTION 'invalid_order_shop_scope';
 END IF;
 IF NOT v_reserved THEN PERFORM private.apply_order_item_stock(p_order_id,false); END IF;
 UPDATE public.orders SET status='confirmed',confirmed_at=now(),stock_reserved=true,updated_at=now() WHERE id=p_order_id;
 INSERT INTO public.audit_logs(actor_id,action,entity_type,entity_id,description,metadata)
 VALUES (auth.uid(),'update'::public.audit_action,'order',p_order_id,'Order confirmed by seller',jsonb_build_object('from','pending','to','confirmed'));
END;
$function$;

CREATE OR REPLACE FUNCTION public.seller_cancel_order(p_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_status public.order_status; v_reserved boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT private.is_order_seller(p_order_id) THEN
   RAISE EXCEPTION 'forbidden' USING errcode='42501';
 END IF;
 SELECT status,stock_reserved INTO v_status,v_reserved FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
 IF v_status NOT IN ('pending','confirmed') THEN RAISE EXCEPTION 'invalid_order_transition'; END IF;
 IF EXISTS (SELECT 1 FROM public.payments pay WHERE pay.order_id=p_order_id
   AND pay.status IN ('pending','authorized','paid','partially_refunded')) THEN
   RAISE EXCEPTION 'payment_action_required';
 END IF;
 IF (SELECT count(DISTINCT oi.shop_id) FROM public.order_items oi WHERE oi.order_id=p_order_id)<>1 THEN
   RAISE EXCEPTION 'invalid_order_shop_scope';
 END IF;
 IF v_reserved THEN PERFORM private.apply_order_item_stock(p_order_id,true); END IF;
 UPDATE public.orders SET status='cancelled',cancelled_at=now(),stock_reserved=false,updated_at=now() WHERE id=p_order_id;
 INSERT INTO public.audit_logs(actor_id,action,entity_type,entity_id,description,metadata)
 VALUES (auth.uid(),'update'::public.audit_action,'order',p_order_id,'Order cancelled by seller',jsonb_build_object('from',v_status::text,'to','cancelled'));
END;
$function$;

GRANT SELECT ON public.products, public.orders, public.order_items TO authenticated;


-- Minimal finance schema for immutable commission-snapshot integration tests.
CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);
INSERT INTO public.system_settings(key,value)
VALUES ('revant.commission_percent','0.5'::jsonb);

ALTER TABLE public.payments ADD COLUMN paid_at timestamptz;
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  currency character(3) NOT NULL DEFAULT 'XOF',
  available_balance numeric NOT NULL DEFAULT 0,
  pending_balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
);
CREATE TABLE public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id),
  order_id uuid,
  payment_id uuid,
  type text NOT NULL,
  amount numeric NOT NULL,
  currency character(3) NOT NULL DEFAULT 'XOF',
  reference text NOT NULL UNIQUE,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
