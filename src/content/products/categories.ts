export type ProductCategory = {
  slug: string;
  label: string;
};

/**
 * Catégories de démarrage, codées en dur pour l'instant (même approche
 * que src/content/shops/color-palettes.ts) — l'administration pourra
 * plus tard les gérer elle-même (sections 11 et 39 du prompt maître,
 * pas encore construites). Toute modification ici doit être reportée
 * dans la contrainte "products_category_allowed" de la migration
 * 0004_products.sql.
 */
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { slug: "vetements-homme", label: "Vêtements homme" },
  { slug: "vetements-femme", label: "Vêtements femme" },
  { slug: "chaussures", label: "Chaussures" },
  { slug: "sacs-accessoires", label: "Sacs & accessoires" },
  { slug: "maison", label: "Maison" },
  { slug: "autre", label: "Autre" },
];

export function isValidCategory(slug: string): boolean {
  return PRODUCT_CATEGORIES.some((c) => c.slug === slug);
}

export function getCategoryLabel(slug: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
