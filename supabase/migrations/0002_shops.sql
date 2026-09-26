-- Migration : boutiques (shops)
-- À exécuter dans Supabase (SQL Editor du projet, ou `supabase db push`
-- si tu utilises la CLI). Fait suite à 0001_avatar_storage.sql.
-- Aucune valeur secrète dans ce fichier.

-- 1. Table des boutiques.
--    Le Revant ID stable d'une boutique (section 5 du prompt maître)
--    est sa colonne "id" (uuid) : il ne change JAMAIS, y compris
--    lorsque le "slug" utilisé dans l'URL publique /shop/[slug] est
--    modifié (section 7).
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  slogan text,
  description text,
  shop_type text not null default 'standard'
    check (shop_type in ('standard', 'pro', 'fournisseur')),
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shops_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  constraint shops_name_length check (char_length(trim(name)) between 2 and 80)
);

comment on column public.shops.id is
  'Revant ID stable de la boutique. Ne change jamais, y compris lors d''un changement de slug.';
comment on column public.shops.shop_type is
  'standard = boutique classique. pro/fournisseur = attribués UNIQUEMENT par l''administration (section 13) — voir le trigger shops_protect_admin_columns ci-dessous.';
comment on column public.shops.status is
  'active/suspended. Modifiable UNIQUEMENT par l''administration — voir shops_protect_admin_columns.';

-- Une seule boutique par compte pour l'instant (contrainte "unique" sur
-- owner_id ci-dessus). Le modèle pourra évoluer plus tard si Revant
-- doit permettre plusieurs boutiques par utilisateur.

-- 2. Historique des anciens slugs, pour rediriger /shop/ancien-slug vers
--    la boutique correspondante après un changement d'adresse (section 7 :
--    "l'ancien slug doit rediriger vers le nouveau").
create table if not exists public.shop_slug_history (
  slug text primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  replaced_at timestamptz not null default now()
);

-- 3. updated_at automatique.
create or replace function public.shops_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shops_updated_at on public.shops;
create trigger shops_updated_at
  before update on public.shops
  for each row execute function public.shops_set_updated_at();

-- 4. Colonnes réservées à l'administration.
--    "shop_type" (statut Pro / Fournisseur) et "status" (suspension) ne
--    doivent JAMAIS pouvoir être modifiés par le propriétaire de la
--    boutique lui-même, même en contournant le frontend — seule une
--    connexion avec la clé service role (réservée aux futurs outils
--    d'administration, Étape 13) peut le faire. C'est ici, au niveau
--    Postgres, que cette règle est réellement appliquée — pas
--    seulement dans le code de l'application.
create or replace function public.shops_protect_admin_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    if new.shop_type is distinct from old.shop_type then
      raise exception 'shop_type ne peut être modifié que par l''administration';
    end if;
    if new.status is distinct from old.status then
      raise exception 'status ne peut être modifié que par l''administration';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists shops_protect_admin_columns on public.shops;
create trigger shops_protect_admin_columns
  before update on public.shops
  for each row execute function public.shops_protect_admin_columns();

-- 5. Row Level Security.
alter table public.shops enable row level security;
alter table public.shop_slug_history enable row level security;

-- Lecture publique des boutiques actives (page boutique publique /shop/[slug]).
create policy "shops_public_read_active"
on public.shops for select
using (status = 'active');

-- Le propriétaire voit toujours SA boutique, même suspendue.
create policy "shops_owner_read_own"
on public.shops for select
to authenticated
using (auth.uid() = owner_id);

-- Création : un utilisateur ne peut créer une boutique qu'à son propre
-- nom, forcément de type "standard" et "active" à la création (voir
-- commentaires ci-dessus sur shop_type/status).
create policy "shops_owner_insert"
on public.shops for insert
to authenticated
with check (
  auth.uid() = owner_id
  and shop_type = 'standard'
  and status = 'active'
);

-- Mise à jour : le propriétaire peut modifier sa boutique (nom, slogan,
-- description, slug) — le trigger shops_protect_admin_columns empêche
-- déjà toute modification de shop_type/status, même par le propriétaire.
create policy "shops_owner_update"
on public.shops for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

-- Historique des slugs : lecture publique nécessaire pour résoudre une
-- redirection quand un visiteur anonyme ouvre un ancien lien de boutique.
create policy "shop_slug_history_public_read"
on public.shop_slug_history for select
using (true);

-- Écriture réservée au propriétaire de la boutique concernée.
create policy "shop_slug_history_owner_insert"
on public.shop_slug_history for insert
to authenticated
with check (
  exists (
    select 1 from public.shops
    where shops.id = shop_id and shops.owner_id = auth.uid()
  )
);

-- Note : cette migration suppose que l'extension pgcrypto (fournissant
-- gen_random_uuid()) est déjà activée, ce qui est le cas par défaut sur
-- les nouveaux projets Supabase. Si ce n'est pas le cas :
--   create extension if not exists pgcrypto;
