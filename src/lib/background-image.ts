import { compressImageKeepingAspect } from "./image";

export const OFFICIAL_BACKGROUND_BUCKET = "revant-backgrounds";
export const PERSONAL_BACKGROUND_BUCKET = "user-backgrounds";
export const BACKGROUND_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const BACKGROUND_IMAGE_MAX_DIMENSION = 1920;
export const BACKGROUND_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function buildOfficialBackgroundPath(): string {
  return `admin/${Date.now()}.jpg`;
}

/** Chemin isolé par utilisateur : {user_id}/{timestamp}.jpg (même mécanique que l'avatar). */
export function buildPersonalBackgroundPath(userId: string): string {
  return `${userId}/${Date.now()}.jpg`;
}

export function officialBackgroundPublicUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${OFFICIAL_BACKGROUND_BUCKET}/${path}`;
}

export function personalBackgroundPublicUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${PERSONAL_BACKGROUND_BUCKET}/${path}`;
}

export function compressBackgroundImage(file: File): Promise<Blob> {
  return compressImageKeepingAspect(file, BACKGROUND_IMAGE_MAX_DIMENSION, 0.85);
}
