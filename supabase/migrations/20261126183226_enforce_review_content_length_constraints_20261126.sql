-- Enforce review content bounds at the database boundary.
-- Applied to production project xugcmpnrigqfszyfufoc as migration
-- 20261126183226_enforce_review_content_length_constraints_20261126.
-- Do not replay manually.

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_title_length_check
    CHECK (title IS NULL OR char_length(btrim(title)) BETWEEN 1 AND 120),
  ADD CONSTRAINT reviews_body_length_check
    CHECK (body IS NOT NULL AND char_length(btrim(body)) BETWEEN 10 AND 2000);
