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
  created_at: string;
  updated_at: string;
};
