-- Correct product-image Storage ownership checks to match the canonical path:
-- {shop_id}/{file}.jpg. The previous live policy compared the first path
-- segment to auth.uid(), which blocked uploads because the app uses shop.id.
drop policy if exists "revant product images insert" on storage.objects;
create policy "revant product images insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.shops s
    where s.id::text = (storage.foldername(name))[1]
      and s.owner_id = (select auth.uid())
  )
);

drop policy if exists "revant product images update" on storage.objects;
create policy "revant product images update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.shops s
    where s.id::text = (storage.foldername(name))[1]
      and s.owner_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.shops s
    where s.id::text = (storage.foldername(name))[1]
      and s.owner_id = (select auth.uid())
  )
);

drop policy if exists "revant product images delete" on storage.objects;
create policy "revant product images delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.shops s
    where s.id::text = (storage.foldername(name))[1]
      and s.owner_id = (select auth.uid())
  )
);
