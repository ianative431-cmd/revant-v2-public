/** Palettes globales du site Revant. Les identifiants historiques sont conservés
 * pour ne pas invalider les cookies déjà enregistrés chez les utilisateurs. */
export type SitePaletteId = "terracotta" | "slate-lilac";

export const SITE_PALETTES: Record<
  SitePaletteId,
  { label: string; bg: string; surface: string; accent: string; text: string }
> = {
  terracotta: {
    label: "Éditorial Revant — ivoire & forêt",
    bg: "#F5F1E8",
    surface: "#FFFCF6",
    accent: "#F36B21",
    text: "#18251F",
  },
  "slate-lilac": {
    label: "Éditorial Revant — forêt nocturne",
    bg: "#101713",
    surface: "#17211B",
    accent: "#FF8240",
    text: "#F4F1E8",
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
