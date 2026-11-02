-- Migration : arrière-plan par produit (section 5 du prompt maître
-- "compléter l'existant") + ajout de la catégorie Électronique
-- (section 8). Fait suite à 0008_backgrounds_storage.sql.

alter table public.products
  add column if not exists background_id uuid references public.backgrounds(id) on delete set null,
  add column if not exists personal_background_id uuid references public.user_backgrounds(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_background_exclusive'
  ) then
    alter table public.products
      add constraint products_background_exclusive
      check (background_id is null or personal_background_id is null);
  end if;
end $$;

comment on column public.products.background_id is
  'Arrière-plan officiel choisi pour CETTE annonce (indépendant de celui de la boutique) — section 5 du prompt maître "compléter l''existant". NULL = arrière-plan par défaut.';

-- Ajout de la catégorie Électronique à la contrainte existante (source
-- de vérité applicative : src/content/products/categories.ts).
alter table public.products drop constraint if exists products_category_allowed;
alter table public.products add constraint products_category_allowed check (
  category in (
    'vetements-homme', 'vetements-femme', 'chaussures', 'sacs-accessoires',
    'maison', 'electronique', 'autre'
  )
);
