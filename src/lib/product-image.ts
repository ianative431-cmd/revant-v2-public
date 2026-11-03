import { compressImageKeepingAspect } from "./image";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8 Mo avant compression
export const PRODUCT_IMAGE_MAX_DIMENSION = 1600; // px, plus grand côté après compression
export const PRODUCT_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Chemin de stockage isolé par boutique : {shop_id}/{uuid}.jpg.
 * Le préfixe {shop_id}/ permet aux règles RLS Supabase Storage de garantir
 * qu'un vendeur ne peut écrire que dans sa propre boutique. L'UUID évite
 * les collisions lorsque plusieurs photos sont envoyées très rapidement.
 */
export function buildProductImagePath(shopId: string): string {
  return `${shopId}/${crypto.randomUUID()}.jpg`;
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

/** Vérifie la signature réelle du fichier, sans se fier uniquement au MIME
 * déclaré par le navigateur ou le nom du fichier.
 */
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
