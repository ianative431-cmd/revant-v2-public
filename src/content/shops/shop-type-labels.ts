import type { ShopType } from "@/types/shop";

/**
 * Libellé affiché pour chaque type de boutique. Source unique utilisée à
 * la fois par la page publique (/shop/[slug]) et le tableau de bord
 * vendeur (/compte/boutique) — pour éviter que les deux dérivent avec
 * le temps.
 */
const SHOP_TYPE_LABELS: Record<ShopType, string> = {
  standard: "Boutique classique",
  restaurant: "Restaurant",
  pro: "Boutique Pro",
  fournisseur: "Fournisseur",
};

export function getShopTypeLabel(shopType: ShopType): string {
  return SHOP_TYPE_LABELS[shopType];
}
