import type { ShopType } from "@/types/shop";

/**
 * "standard" = comptes normaux. "pro" = comptes professionnels (types de
 * boutique "pro" ET "fournisseur" — voir getPalettesForShopType).
 */
export type ShopPaletteAudience = "standard" | "pro";

export type ShopColorPalette = {
  /** Identifiant stable, stocké dans shops.color_palette_id. */
  id: string;
  name: string;
  audience: ShopPaletteAudience;
  /** Couleurs hex, dans l'ordre d'affichage (du haut vers le bas). */
  colors: string[];
};

/**
 * Catalogue codé en dur pour l'instant (même approche que
 * src/content/legal/documents.ts) : une seule source de vérité,
 * modifiable ici en attendant la bibliothèque de palettes pilotable
 * depuis l'administration (section 39 du prompt maître, Étape 13 —
 * pas encore construite).
 */
export const SHOP_COLOR_PALETTES: ShopColorPalette[] = [
  {
    id: "terracotta",
    name: "Terracotta",
    audience: "standard",
    colors: ["#1F1D20", "#4B2427", "#803E2F", "#A79986", "#3C332E", "#3E3D38"],
  },
  {
    id: "ardoise",
    name: "Ardoise",
    audience: "pro",
    colors: ["#191D23", "#57707A", "#7B919C", "#989DAA", "#C5BAC4", "#DEDCDC"],
  },
  {
    id: "lune",
    name: "Lune",
    audience: "pro",
    colors: ["#F5D5E0", "#6667AB", "#7B337E", "#420D4B", "#210635"],
  },
];

/**
 * Palettes autorisées pour un type de boutique donné. Les boutiques
 * "pro" ET "fournisseur" partagent le même ensemble de palettes
 * "professionnelles" — seules les boutiques "standard" reçoivent
 * l'ensemble "standard". Utilisé à la fois pour l'affichage et pour la
 * revérification côté serveur (jamais uniquement côté frontend).
 */
/**
 * Palettes autorisées pour un type de boutique donné. Les boutiques
 * "standard" ET "restaurant" partagent l'ensemble "standard" (ce sont
 * deux choix de commerce ordinaires, pas des paliers professionnels) ;
 * "pro" et "fournisseur" partagent l'ensemble "pro". Utilisé à la fois
 * pour l'affichage et pour la revérification côté serveur (jamais
 * uniquement côté frontend).
 */
export function getPalettesForShopType(shopType: ShopType): ShopColorPalette[] {
  const audience: ShopPaletteAudience =
    shopType === "standard" || shopType === "restaurant" ? "standard" : "pro";
  return SHOP_COLOR_PALETTES.filter((p) => p.audience === audience);
}

export function getPaletteById(id: string): ShopColorPalette | undefined {
  return SHOP_COLOR_PALETTES.find((p) => p.id === id);
}
