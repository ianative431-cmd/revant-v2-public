import { compressImageKeepingAspect } from "./image";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8 Mo avant compression
export const PRODUCT_IMAGE_MAX_DIMENSION = 1600; // px, plus grand côté après compression
export const PRODUCT_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Chemin de stockage : {owner_id}/{shop_id}/{timestamp}.jpg.
 * La policy Storage actuellement déployée vérifie que le premier dossier
 * correspond à auth.uid(); le dossier boutique conserve ensuite le rangement
 * par boutique sans contourner le contrôle de propriété.
 */
export function buildProductImagePath(ownerId: string, shopId: string): string {
  return `${ownerId}/${shopId}/${Date.now()}.jpg`;
}

/** URL publique déterministe, sans appel réseau (bucket public). */
export function productImagePublicUrl(supabaseUrl: string, imagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${imagePath}`;
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
