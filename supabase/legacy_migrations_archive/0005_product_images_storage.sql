-- Migration : stockage des photos d'annonces (product-images). Fait
-- suite à 0004_products.sql. Aucune valeur secrète dans ce fichier.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lecture publique (les photos d'annonces sont publiques par nature).
create policy "product_images_public_read"
on storage.objects for select
using (bucket_id = 'product-images');

-- Écriture strictement limitée au dossier de SA PROPRE boutique.
-- Les fichiers sont stockés sous "{shop_id}/{fichier}.jpg" — ces
-- policies vérifient, en base, que ce shop_id appartient bien à
-- l'utilisateur authentifié (jamais une confiance aveugle dans ce que
-- le client prétend).
create policy "product_images_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.shops
    where shops.id::text = (storage.foldername(name))[1]
      and shops.owner_id = auth.uid()
  )
);

create policy "product_images_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.shops
    where shops.id::text = (storage.foldername(name))[1]
      and shops.owner_id = auth.uid()
  )
);

create policy "product_images_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.shops
    where shops.id::text = (storage.foldername(name))[1]
      and shops.owner_id = auth.uid()
  )
);
