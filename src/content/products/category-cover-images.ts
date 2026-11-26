// Les couvertures de catégories utilisent uniquement des images réellement
// enregistrées dans le stockage public du projet Supabase Revant.
// En l'absence d'image fiable, l'interface affiche un visuel graphique de marque.
export function getCategoryCoverImage(_slug: string, imageUrl?: string | null): string | null {
  if (!imageUrl) return null;

  try {
    const image = new URL(imageUrl);
    const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configuredUrl) return null;

    const configuredStorage = new URL(configuredUrl);
    if (
      image.protocol !== "https:" ||
      image.origin !== configuredStorage.origin ||
      image.username ||
      image.password ||
      !image.pathname.startsWith("/storage/v1/object/public/")
    ) {
      return null;
    }

    return image.toString();
  } catch {
    return null;
  }
}
