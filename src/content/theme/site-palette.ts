/** Palettes globales du site Revant. Les identifiants historiques sont conservés
 * pour ne pas invalider les cookies déjà enregistrés chez les utilisateurs. */
export type SitePaletteId = "terracotta" | "slate-lilac";

export const SITE_PALETTES: Record<
  SitePaletteId,
  { label: string; bg: string; surface: string; accent: string; text: string }
> = {
  terracotta: {
    label: "Clair — blanc & orange",
    bg: "#FFFFFF",
    surface: "#FFF7ED",
    accent: "#F97316",
    text: "#171717",
  },
  "slate-lilac": {
    label: "Sombre — noir & orange",
    bg: "#090909",
    surface: "#171717",
    accent: "#F97316",
    text: "#F5F5F5",
  },
};

export const DEFAULT_SITE_PALETTE: SitePaletteId = "terracotta";
export const SITE_PALETTE_COOKIE = "revant-palette";

export function isSitePaletteId(value: string | undefined | null): value is SitePaletteId {
  return value === "terracotta" || value === "slate-lilac";
}

export function setSitePaletteCookie(id: SitePaletteId) {
  document.cookie = `${SITE_PALETTE_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
}
