-- This migration is already applied to the active Supabase project.
-- Repository-history restoration only; do not manually reapply to the active database.

DROP INDEX IF EXISTS public.order_items_shop_idx;
