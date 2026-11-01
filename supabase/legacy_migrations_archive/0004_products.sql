-- Migration : catalogue produits / annonces (sections 11 et 31 du
-- prompt maître). Fait suite à 0003_shops_color_palette.sql. Aucune
-- valeur secrète dans ce fichier.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  title text not null,
  description text,
  price_fcfa integer not null,
  category text not null,
  image_path text not null,
  status text not null default 'active' check (status in ('active', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_title_length check (char_length(trim(title)) between 2 and 120),
  constraint products_description_length check (description is null or char_length(description) <= 2000),
  constraint products_price_positive check (price_fcfa > 0 and price_fcfa <= 100000000),
  -- Catégories de démarrage, codées en dur (comme shop_type sur les
  -- boutiques) — doivent rester synchronisées avec
  -- src/content/products/categories.ts, la source de vérité applicative.
  -- Une vraie gestion des catégories par l'administration viendra avec
  -- la section 39 (Étape 13, pas encore construite).
  constraint products_category_allowed check (
    category in ('vetements-homme', 'vetements-femme', 'chaussures', 'sacs-accessoires', 'maison', 'autre')
  )
);

comment on column public.products.id is 'Revant ID stable de l''annonce.';
comment on column public.products.image_path is
  'Chemin dans le bucket Storage "product-images" (ex. "{shop_id}/{fichier}.jpg"), voir migration 0005.';
comment on column public.products.status is
  '"sold" reste consultable publiquement (badge "Vendu"), comme sur une marketplace de seconde main classique — jamais masqué ni supprimé automatiquement.';

create or replace function public.products_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.products_set_updated_at();

alter table public.products enable row level security;

-- Lecture publique de toutes les annonces, y compris "sold" (affichées
-- avec un badge plutôt que masquées).
create policy "products_public_read"
on public.products for select
using (true);

-- Création : uniquement dans SA PROPRE boutique, forcément à l'état
-- "active" (on ne peut pas publier une annonce déjà "vendue").
create policy "products_owner_insert"
on public.products for insert
to authenticated
with check (
  status = 'active'
  and exists (
    select 1 from public.shops
    where shops.id = shop_id and shops.owner_id = auth.uid()
  )
);

-- Modification et suppression : uniquement le propriétaire de la
-- boutique concernée.
create policy "products_owner_update"
on public.products for update
to authenticated
using (
  exists (select 1 from public.shops where shops.id = shop_id and shops.owner_id = auth.uid())
)
with check (
  exists (select 1 from public.shops where shops.id = shop_id and shops.owner_id = auth.uid())
);

create policy "products_owner_delete"
on public.products for delete
to authenticated
using (
  exists (select 1 from public.shops where shops.id = shop_id and shops.owner_id = auth.uid())
);

-- Index pour la page d'accueil (derniers articles actifs) et pour la
-- page boutique (produits d'une boutique donnée).
create index if not exists products_active_created_at_idx
  on public.products (created_at desc)
  where status = 'active';

create index if not exists products_shop_id_idx on public.products (shop_id);
