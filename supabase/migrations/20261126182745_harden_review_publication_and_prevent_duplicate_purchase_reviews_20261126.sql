-- Review publication hardening.
-- Applied to production project xugcmpnrigqfszyfufoc as migration
-- 20261126182745_harden_review_publication_and_prevent_duplicate_purchase_reviews_20261126.
-- This file records the already-applied production migration; do not replay manually.

ALTER TABLE public.reviews
  ALTER COLUMN is_published SET DEFAULT false;

REVOKE INSERT ON TABLE public.reviews FROM authenticated;

GRANT INSERT (
  id,
  user_id,
  product_id,
  shop_id,
  order_id,
  rating,
  title,
  body,
  created_at,
  updated_at
) ON TABLE public.reviews TO authenticated;

DROP POLICY IF EXISTS "buyers can review purchased products" ON public.reviews;
CREATE POLICY "buyers can submit unpublished reviews for delivered purchases"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND order_id IS NOT NULL
  AND product_id IS NOT NULL
  AND shop_id IS NULL
  AND is_published = false
  AND private.is_order_buyer(order_id)
  AND EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = reviews.order_id
      AND oi.product_id = reviews.product_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = reviews.order_id
      AND o.status = 'delivered'::public.order_status
  )
);

DROP POLICY IF EXISTS "users update own reviews" ON public.reviews;
CREATE POLICY "users can edit own unpublished reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  AND is_published = false
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND is_published = false
);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_product_review_per_order_uidx
ON public.reviews (order_id, product_id)
WHERE product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_shop_review_per_order_uidx
ON public.reviews (order_id, shop_id)
WHERE shop_id IS NOT NULL;
