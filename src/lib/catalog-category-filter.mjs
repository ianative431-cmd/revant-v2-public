/** Resolve a public catalog slug to its real database category first.
 * The legacy product-type shortcut is only a fallback while categories
 * cannot be loaded; it must never hide products assigned to a real category.
 */
export function resolveCatalogCategoryFilter(categorySlug, categories, categoriesUnavailable = false) {
  if (!categorySlug) return {};

  const category = categories.find((item) => item.slug === categorySlug);
  if (category) return { categoryId: category.id };

  if (categoriesUnavailable && categorySlug === "mode") {
    return { productType: "clothing" };
  }
  if (categoriesUnavailable && categorySlug === "parfums") {
    return { productType: "perfume" };
  }

  return null;
}
