export type ProductStatus = "active" | "sold";

export type Product = {
  /** Revant ID stable de l'annonce. */
  id: string;
  shop_id: string;
  title: string;
  description: string | null;
  price_fcfa: number;
  category: string;
  image_path: string;
  status: ProductStatus;
  /** Arrière-plan officiel choisi pour cette annonce (indépendant de celui de la boutique). */
  background_id: string | null;
  created_at: string;
  updated_at: string;
};
