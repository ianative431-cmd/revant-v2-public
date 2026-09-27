-- Migration : stockage des arrière-plans (buckets revant-backgrounds et
-- user-backgrounds). Fait suite à 0007_backgrounds.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('revant-backgrounds', 'revant-backgrounds', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-backgrounds', 'user-backgrounds', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Bibliothèque officielle : lecture publique, écriture réservée aux
-- administrateurs (vérifié en base via profiles.role, pas côté client).
create policy "revant_backgrounds_public_read"
on storage.objects for select
using (bucket_id = 'revant-backgrounds');

create policy "revant_backgrounds_admin_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'revant-backgrounds'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "revant_backgrounds_admin_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'revant-backgrounds'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "revant_backgrounds_admin_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'revant-backgrounds'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Arrière-plans personnels : lecture publique (affichage sur boutique
-- publique), écriture limitée au dossier "{uid}/" de son propriétaire —
-- même mécanique que le bucket "avatars".
create policy "user_backgrounds_public_read"
on storage.objects for select
using (bucket_id = 'user-backgrounds');

create policy "user_backgrounds_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'user-backgrounds'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "user_backgrounds_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'user-backgrounds'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "user_backgrounds_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'user-backgrounds'
  and (storage.foldername(name))[1] = auth.uid()::text
);
