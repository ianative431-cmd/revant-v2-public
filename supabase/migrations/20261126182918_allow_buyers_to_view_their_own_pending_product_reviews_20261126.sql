-- Allow buyers to inspect their own reviews, including those awaiting moderation.
-- Applied to production project xugcmpnrigqfszyfufoc as migration
-- 20261126182918_allow_buyers_to_view_their_own_pending_product_reviews_20261126.
-- Do not replay manually.

CREATE POLICY "buyers can view their own reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));
