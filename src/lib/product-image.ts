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
  return `${shopId}/${crypto.randomUUID()}.jpg`;
}

/** URL publique déterministe, sans appel réseau (bucket public). */
export function productImagePublicUrl(supabaseUrl: string, imagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${imagePath}`;
}

/** N'accepte que les URL HTTPS du bucket public du projet Supabase configuré. */
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
      image.username ||
      image.password ||
      !image.pathname.startsWith(`/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`)
    ) return null;
    return image.toString();
  } catch {
    return null;
  }
}

/** Vérifie la signature du fichier, pas seulement son extension ou MIME déclaré. */
export async function hasValidProductImageSignature(file: File): Promise<boolean> {
  if (file.size === 0 || !PRODUCT_IMAGE_ALLOWED_TYPES.includes(file.type)) return false;
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return (file.type === "image/jpeg" && isJpeg) || (file.type === "image/png" && isPng) ||
    (file.type === "image/webp" && isWebp);
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
