/**
 * "standard" et "restaurant" sont choisis librement par le vendeur à la
 * création (voir migration 0010_restaurant_shop_type.sql). "pro" et
 * "fournisseur" restent attribués UNIQUEMENT par l'administration (voir
 * le trigger shops_protect_admin_columns) — aucun code applicatif ne doit
 * permettre à un vendeur de se les attribuer lui-même.
 */
export type ShopType = "standard" | "restaurant" | "pro" | "fournisseur";

/** Types de boutique qu'un utilisateur peut choisir lui-même à la création. */
export const SELF_SERVICE_SHOP_TYPES = ["standard", "restaurant"] as const;

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
  /** Arrière-plan officiel choisi (mutuellement exclusif avec personal_background_id). */
  background_id: string | null;
  /** Arrière-plan personnel choisi (mutuellement exclusif avec background_id). */
  personal_background_id: string | null;
  created_at: string;
  updated_at: string;
};
