-- Increase the per-file limit for shop logos, banners and product photos.
-- Client-side image validation still checks actual file signatures and compresses
-- banners/product photos before upload; storage writes remain owner-scoped by RLS.

update storage.buckets
set file_size_limit = 26214400
where id in ('shop-media', 'product-images');
