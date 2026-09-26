-- Migration : palette de couleurs de boutique (sections 8 et 9 du
-- prompt maître). Fait suite à 0002_shops.sql. Aucune valeur secrète
-- dans ce fichier.

alter table public.shops
  add column if not exists color_palette_id text;

comment on column public.shops.color_palette_id is
  'Identifiant de la palette prédéfinie choisie (voir src/content/shops/color-palettes.ts, source unique de vérité — pas de table dédiée pour l''instant). NULL = aucune palette choisie. La correspondance entre shop_type et les palettes autorisées (standard vs pro/fournisseur) est revérifiée côté serveur à chaque enregistrement (src/server/shops/actions.ts) — jamais uniquement côté frontend.';
