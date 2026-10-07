import type { Enums } from "@/types/database";

export type ProductStatus = Enums<"product_status">;

/**
 * Modèle réel (table products + product_images + categories, schéma
 * Supabase actuel) : plusieurs photos par produit (ordonnées), prix
 * avec devise explicite, catégorie reliée à une vraie table plutôt
 * qu'une chaîne libre. "sold" n'existe plus comme statut dédié — le
 * stock (stock_quantity = 0) indique un article épuisé.
 */
export type Product = {
  /** Revant ID stable de l'annonce. */
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  base_price: number;
  currency: string;
  stock_quantity: number;
  status: ProductStatus;
  slug: string;
  category_id: string | null;
  categoryName: string | null;
  /** URLs publiques, dans l'ordre d'affichage (image principale en premier). */
  images: string[];
  created_at: string;
  updated_at: string;
};
