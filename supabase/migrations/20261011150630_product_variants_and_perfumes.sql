-- Revant product attributes: per-size clothing inventory and simple perfume volume.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS size_stock jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS perfume_volume_ml integer;

ALTER TABLE public.products
  ADD CONSTRAINT products_product_type_allowed
    CHECK (product_type IN ('clothing', 'perfume', 'other')),
  ADD CONSTRAINT products_size_stock_object
    CHECK (jsonb_typeof(size_stock) = 'object'),
  ADD CONSTRAINT products_perfume_volume_valid
    CHECK (perfume_volume_ml IS NULL OR perfume_volume_ml BETWEEN 1 AND 5000);

COMMENT ON COLUMN public.products.size_stock IS
  'JSON object mapping clothing size labels to non-negative available quantities, e.g. {"S":5,"M":8}.';
COMMENT ON COLUMN public.products.perfume_volume_ml IS
  'Optional perfume bottle volume in millilitres.';
COMMENT ON COLUMN public.products.product_type IS
  'Product-specific fields to render in seller and buyer interfaces: clothing, perfume or other.';
