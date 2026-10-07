/**
 * Statut réel d'une boutique (table shops, schéma Supabase actuel).
 * "draft"/"pending" et "closed" s'ajoutent à l'ancien "active"/"suspended" —
 * le cycle de vie complet est désormais piloté par l'admin/modération.
 */
export type ShopStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/**
 * Le modèle "shop_type" (standard/restaurant/pro/fournisseur) a été
 * remplacé par des indicateurs indépendants sur la vraie boutique :
 * is_restaurant, is_pro, is_premium. is_restaurant reste le seul que
 * le vendeur peut choisir lui-même à la création ; is_pro et
 * is_premium restent réservés à l'administration.
 */
export type Shop = {
  /** Revant ID stable de la boutique — ne change jamais, même si le slug change. */
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string | null;
  status: ShopStatus;
  is_restaurant: boolean;
  is_pro: boolean;
  is_premium: boolean;
  country_code: string;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  snapchat: string | null;
  tiktok: string | null;
  logo_url: string | null;
  banner_url: string | null;
  /** Identifiant de la palette prédéfinie choisie, voir src/content/shops/color-palettes.ts. */
  background_color: string | null;
  background_image_url: string | null;
  created_at: string;
  updated_at: string;
};
