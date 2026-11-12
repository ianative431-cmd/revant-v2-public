/** Palettes globales du site Revant. Les identifiants historiques sont conservés
 * pour ne pas invalider les cookies déjà enregistrés chez les utilisateurs. */
export type SitePaletteId = "terracotta" | "slate-lilac";

export const SITE_PALETTES: Record<
  SitePaletteId,
  { label: string; bg: string; surface: string; accent: string; text: string }
> = {
  terracotta: {
    label: "Mode clair",
    bg: "#F7F4EE",
    surface: "#FFFFFF",
    accent: "#D94F0B",
    text: "#202832",
  },
  "slate-lilac": {
    label: "Mode sombre",
    bg: "#101923",
    surface: "#1B2937",
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
