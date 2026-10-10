export type OrderStatus = "en_attente" | "confirmee" | "annulee";

export type Order = {
  /** Revant ID stable de la commande — sert aussi de numéro de reçu. */
  id: string;
  product_id: string;
  shop_id: string;
  buyer_id: string | null;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  delivery_city?: string | null;
  delivery_address?: string | null;
  /** Copié au moment de la commande, ne change jamais après (intégrité du reçu). */
  product_title: string;
  /** Nom de boutique copié depuis la boutique associée à l'article. */
  shop_name: string;
  price_fcfa: number;
  status: OrderStatus;
  created_at: string;
  confirmed_at: string | null;
};
