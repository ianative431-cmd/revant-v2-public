-- Ensure the product image bucket matches the upload flow in
-- src/app/compte/boutique/produits/nouveau/NewProductForm.tsx.
-- Public reads are intentional for marketplace product photos; writes are
-- still restricted by the owner-scoped storage.objects policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
