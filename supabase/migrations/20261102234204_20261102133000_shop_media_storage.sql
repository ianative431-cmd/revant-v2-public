-- Track the shop-media Storage bucket and owner-only write rules.
-- Public reads are enabled by the bucket's public=true setting; writes remain
-- restricted to the authenticated shop owner folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-media',
  'shop-media',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "revant shop media insert" on storage.objects;
create policy "revant shop media insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shop-media'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "revant shop media update" on storage.objects;
create policy "revant shop media update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'shop-media'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'shop-media'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "revant shop media delete" on storage.objects;
create policy "revant shop media delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'shop-media'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);