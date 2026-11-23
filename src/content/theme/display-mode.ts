export type DisplayMode = "system" | "light" | "dark";

export const DISPLAY_MODE_COOKIE = "revant-display-mode";
export const LEGACY_SITE_PALETTE_COOKIE = "revant-palette";
export const DEFAULT_DISPLAY_MODE: DisplayMode = "system";

export function isDisplayMode(value: string | undefined | null): value is DisplayMode {
  return value === "system" || value === "light" || value === "dark";
}
