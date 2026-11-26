-- Disposable CI-only schema harness. No Supabase project or production data is accessed.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;
CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)
$$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(auth.jwt()->>'sub','')::uuid
$$;
CREATE TABLE public.shops (
 id uuid PRIMARY KEY, owner_id uuid, name text NOT NULL, city text, phone text, status text NOT NULL
);
CREATE TABLE public.products (
 id uuid PRIMARY KEY, name text NOT NULL, base_price numeric NOT NULL, currency text NOT NULL,
 stock_quantity integer NOT NULL, shop_id uuid NOT NULL REFERENCES public.shops(id),
 status text NOT NULL, product_type text NOT NULL DEFAULT 'other' CHECK (product_type IN ('clothing','perfume','other')),
 size_stock jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE public.orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id uuid, order_number text NOT NULL UNIQUE,
 status text NOT NULL, currency text NOT NULL, subtotal numeric NOT NULL, delivery_fee numeric NOT NULL,
 total_amount numeric NOT NULL, placed_at timestamptz NOT NULL, guest_name text, guest_phone text,
 guest_city text, guest_address text, guest_tracking_token_hash text, idempotency_key uuid UNIQUE,
 stock_reserved boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.orders(id),
 product_id uuid NOT NULL REFERENCES public.products(id), shop_id uuid NOT NULL REFERENCES public.shops(id),
 product_name text NOT NULL, variant_label text, quantity integer NOT NULL,
 unit_price numeric NOT NULL, line_total numeric NOT NULL, currency text NOT NULL
);
CREATE TABLE public.deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.orders(id),
 status text NOT NULL, delivery_address text, pickup_address text, UNIQUE(order_id)
);
CREATE TABLE private.delivery_code_secrets (
 delivery_id uuid PRIMARY KEY REFERENCES public.deliveries(id), code_ciphertext text, code_hint text
);
CREATE FUNCTION private.get_guest_order_impl(text,text) RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
GRANT USAGE ON SCHEMA public,private,auth TO anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON auth.users TO service_role;
