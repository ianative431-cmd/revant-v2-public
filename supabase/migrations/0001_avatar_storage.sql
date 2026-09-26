-- Migration : stockage des photos de profil (avatars)
-- À exécuter dans Supabase (SQL Editor du projet, ou `supabase db push`
-- si tu utilises la CLI). Aucune valeur secrète dans ce fichier.

-- 1. Bucket public en lecture (les avatars sont affichés publiquement
--    dans l'app, comme sur une fiche vendeur), mais dont l'écriture est
--    strictement contrôlée par les policies ci-dessous.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Lecture publique (nécessaire pour afficher l'avatar à d'autres
--    utilisateurs : profil vendeur, annonces, etc.)
create policy "avatars_public_read"
on storage.objects for select
using (bucket_id = 'avatars');

-- 3. Écriture strictement limitée à SON PROPRE dossier.
--    Les fichiers sont stockés sous le chemin "{uid}/{fichier}.jpg" —
--    cette policy vérifie que le premier segment du chemin correspond
--    bien à l'utilisateur authentifié. C'est ici, côté serveur Postgres,
--    que la sécurité réelle est appliquée : peu importe ce qu'un client
--    modifié tenterait d'envoyer, Supabase refusera toute écriture hors
--    du dossier de l'utilisateur connecté.
create policy "avatars_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Note : si ta version de Supabase ne supporte pas encore les colonnes
-- file_size_limit / allowed_mime_types sur storage.buckets, retire ces
-- deux paramètres de l'INSERT ci-dessus — la limite de taille/type
-- restera de toute façon appliquée côté client (src/lib/avatar.ts).
