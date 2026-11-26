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
