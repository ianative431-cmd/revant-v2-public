/**
 * Types de boutique (section 13 du prompt maître). "pro" et
 * "fournisseur" ne peuvent être attribués que par l'administration
 * (voir supabase/migrations/0002_shops.sql, trigger
 * shops_protect_admin_columns) — aucun code applicatif ne doit
 * permettre à un vendeur de se les attribuer lui-même.
 */
export type ShopType = "standard" | "pro" | "fournisseur";

/**
 * "suspended" ne peut être défini que par l'administration (même
 * garantie base de données que ci-dessus).
 */
export type ShopStatus = "active" | "suspended";

export type Shop = {
  /** Revant ID stable de la boutique — ne change jamais, même si le slug change. */
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  slogan: string | null;
  description: string | null;
  shop_type: ShopType;
  status: ShopStatus;
  /** Identifiant de la palette prédéfinie choisie, voir src/content/shops/color-palettes.ts. */
  color_palette_id: string | null;
  created_at: string;
  updated_at: string;
};
