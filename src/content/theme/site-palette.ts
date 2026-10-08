/**
 * Les deux palettes du site Revant lui-même (header, pages publiques,
 * compte, etc.) — distinctes du catalogue de palettes "boutique"
 * (src/content/shops/color-palettes.ts) même si les couleurs
 * Terracotta/Ardoise y sont identiques : ici il n'y a que ces deux
 * choix, et ils remplacent entièrement l'ancienne charte beige/noir.
 *
 * Toute modification des valeurs hex doit être répercutée dans
 * src/app/globals.css (les blocs [data-site-palette="..."]).
 */
export type SitePaletteId = "terracotta" | "slate-lilac";

export const SITE_PALETTES: Record<
  SitePaletteId,
  { label: string; bg: string; surface: string; accent: string; text: string }
> = {
  terracotta: {
    label: "Terracotta",
    bg: "#A79986",
    surface: "#3E3D38",
    accent: "#803E2F",
    text: "#1F1D20",
  },
  "slate-lilac": {
    label: "Slate-Lilac",
    bg: "#DEDCDC",
    surface: "#C5BAC4",
    accent: "#57707A",
    text: "#191D23",
  },
};

export const DEFAULT_SITE_PALETTE: SitePaletteId = "terracotta";
export const SITE_PALETTE_COOKIE = "revant-palette";

export function isSitePaletteId(value: string | undefined | null): value is SitePaletteId {
  return value === "terracotta" || value === "slate-lilac";
}

/** Pose le cookie de palette côté client (fonction utilitaire hors composant,
 * voir le même motif dans src/lib/cookie-consent.ts). */
export function setSitePaletteCookie(id: SitePaletteId) {
  document.cookie = `${SITE_PALETTE_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
}
