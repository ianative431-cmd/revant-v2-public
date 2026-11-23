import "server-only";
import { cookies } from "next/headers";
import {
  DEFAULT_DISPLAY_MODE,
  DISPLAY_MODE_COOKIE,
  LEGACY_SITE_PALETTE_COOKIE,
  isDisplayMode,
  type DisplayMode,
} from "@/content/theme/display-mode";

/**
 * The display mode is independent from the Tangerine brand palette.
 * Existing palette cookies are mapped once for backward compatibility.
 */
export async function getDisplayMode(): Promise<DisplayMode> {
  const store = await cookies();
  const savedMode = store.get(DISPLAY_MODE_COOKIE)?.value;
  if (isDisplayMode(savedMode)) return savedMode;

  const legacyPalette = store.get(LEGACY_SITE_PALETTE_COOKIE)?.value;
  if (legacyPalette === "slate-lilac") return "dark";
  if (legacyPalette === "terracotta") return "light";
  return DEFAULT_DISPLAY_MODE;
}
