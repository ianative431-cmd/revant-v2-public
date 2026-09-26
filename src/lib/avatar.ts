export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 Mo avant compression
export const AVATAR_OUTPUT_SIZE = 512; // px, carré, après recadrage/compression
export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Construit un chemin de stockage propre et prévisible, isolé par
 * utilisateur : {uid}/{timestamp}.jpg. Le préfixe {uid}/ est ce qui
 * permet aux règles RLS Supabase Storage (voir la migration SQL) de
 * garantir qu'un utilisateur ne peut écrire/supprimer que dans SON
 * propre dossier — jamais celui d'un autre.
 */
export function buildAvatarPath(userId: string): string {
  return `${userId}/${Date.now()}.jpg`;
}

/**
 * Extrait le chemin de stockage (ex. "uid/169....jpg") depuis une URL
 * publique Supabase Storage, pour pouvoir supprimer l'ancien fichier
 * lors du remplacement ou de la suppression de l'avatar.
 */
export function extractAvatarPathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${AVATAR_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export function initialsFromUser(email?: string | null, phone?: string | null): string {
  const source = email ?? phone ?? "?";
  return source.trim().slice(0, 2).toUpperCase();
}
