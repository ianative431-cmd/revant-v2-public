/** Palettes globales du site Revant. Les identifiants historiques sont conservés
 * pour ne pas invalider les cookies déjà enregistrés chez les utilisateurs. */
export type SitePaletteId = "terracotta" | "slate-lilac";

export const SITE_PALETTES: Record<
  SitePaletteId,
  { label: string; bg: string; surface: string; accent: string; text: string }
> = {
  terracotta: {
    label: "Tangerine électrique — clair",
    bg: "#F8F5EF",
    surface: "#FFFFFF",
    accent: "#F46A18",
    text: "#20252B",
  },
  "slate-lilac": {
    label: "Tangerine électrique — sombre",
    bg: "#080808",
    surface: "#111111",
    accent: "#FF914D",
    text: "#F4F1EB",
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
