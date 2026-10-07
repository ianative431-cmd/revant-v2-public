import type { Shop } from "@/types/shop";

/**
 * Libellé affiché pour le "type" d'une boutique. Dérivé des indicateurs
 * réels (is_restaurant, is_pro, is_premium) — il n'existe plus de
 * colonne shop_type unique en base. Source unique utilisée à la fois
 * par la page publique (/shop/[slug]) et le tableau de bord vendeur
 * (/compte/boutique) — pour éviter que les deux dérivent avec le temps.
 */
export function getShopTypeLabel(shop: Pick<Shop, "is_restaurant" | "is_pro" | "is_premium">): string {
  if (shop.is_restaurant) return "Restaurant";
  if (shop.is_premium) return "Boutique Premium";
  if (shop.is_pro) return "Boutique Pro";
  return "Boutique classique";
}
