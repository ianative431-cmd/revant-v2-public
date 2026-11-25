// Les catégories utilisent uniquement les visuels réellement enregistrés.
// Sans image validée, l'interface affiche un fond graphique Revant.
export function getCategoryCoverImage(_slug: string, imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  try {
    const url = new URL(imageUrl);
    if (url.protocol === "https:") return url.toString();
  } catch {
    // Ignore malformed database values; the caller displays a branded fallback.
  }
  return null;
}
