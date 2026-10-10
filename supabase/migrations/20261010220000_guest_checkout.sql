-- Allow checkout without creating a buyer account.
-- Guest orders are written only by a server-side service-role action; no anon table insert policy is added.
ALTER TABLE public.orders
  ALTER COLUMN buyer_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS delivery_city text,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS guest_access_token_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_guest_access_token_hash_uidx
  ON public.orders (guest_access_token_hash)
  WHERE guest_access_token_hash IS NOT NULL;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_guest_checkout_details_check
  CHECK (
    buyer_id IS NOT NULL OR (
      guest_name IS NOT NULL AND length(trim(guest_name)) BETWEEN 2 AND 120
      AND guest_phone IS NOT NULL AND length(trim(guest_phone)) BETWEEN 7 AND 30
      AND delivery_city IS NOT NULL AND length(trim(delivery_city)) BETWEEN 2 AND 120
      AND delivery_address IS NOT NULL AND length(trim(delivery_address)) BETWEEN 3 AND 500
      AND guest_access_token_hash IS NOT NULL
    )
  );

COMMENT ON COLUMN public.orders.guest_access_token_hash IS
  'SHA-256 hash of a high-entropy guest order access token; never store the raw token.';
