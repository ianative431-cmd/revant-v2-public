/**
 * Normalisation et validation du "slug" d'une boutique (utilisé dans
 * l'URL publique /shop/[slug], section 7 du prompt maître).
 *
 * Ces fonctions sont purement indicatives côté application (pour
 * l'ergonomie du formulaire) — la contrainte réelle, celle qui compte
 * pour la sécurité et l'intégrité des données, est appliquée en base
 * de données (voir supabase/migrations/0002_shops.sql, contrainte
 * "shops_slug_format"). Ne jamais faire confiance uniquement à cette
 * validation côté serveur applicatif.
 */

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 40;

/** Transforme un texte libre (ex. nom de boutique) en slug d'URL. */
export function slugify(input: string): string {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.slice(0, SLUG_MAX_LENGTH).replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  if (slug.length < SLUG_MIN_LENGTH || slug.length > SLUG_MAX_LENGTH) {
    return false;
  }
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug);
}
