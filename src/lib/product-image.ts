import { compressImageKeepingAspect } from "./image";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8 Mo avant compression
export const PRODUCT_IMAGE_MAX_DIMENSION = 1600; // px, plus grand côté après compression
export const PRODUCT_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Chemin de stockage isolé par boutique : {shop_id}/{timestamp}.jpg. Le
 * préfixe {shop_id}/ est ce qui permet aux règles RLS Supabase Storage
 * (migration 0005) de garantir qu'un vendeur ne peut écrire que dans SA
 * PROPRE boutique.
 */
export function buildProductImagePath(shopId: string): string {
  return `${shopId}/${Date.now()}.jpg`;
}

/** URL publique déterministe, sans appel réseau (bucket public). */
export function productImagePublicUrl(supabaseUrl: string, imagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${imagePath}`;
}

/**
 * Accepte uniquement les URLs HTTPS du bucket public réellement autorisé
 * par next.config.ts. Les anciennes valeurs invalides ou externes sont
 * ignorées pour éviter une erreur de rendu Next/Image.
 */
export function safeProductImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const image = new URL(value);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;
    const configuredSupabase = new URL(supabaseUrl);
    if (
      image.protocol !== "https:" ||
      image.origin !== configuredSupabase.origin ||
      !image.pathname.startsWith(`/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`)
    ) return null;
    return image.toString();
  } catch {
    return null;
  }
}

/**
 * Redimensionne (sans recadrer) une image trop grande et la réencode en
 * JPEG pour limiter le poids envoyé/stocké. Contrairement à l'avatar
 * (carré forcé), une photo d'annonce garde ses proportions d'origine — 
 * seule la taille maximale est bornée.
 */
export function compressProductImage(file: File): Promise<Blob> {
  return compressImageKeepingAspect(file, PRODUCT_IMAGE_MAX_DIMENSION, 0.82);
}
