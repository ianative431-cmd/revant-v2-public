import "server-only";
import { cookies } from "next/headers";
import {
  DEFAULT_SITE_PALETTE,
  SITE_PALETTE_COOKIE,
  isSitePaletteId,
  type SitePaletteId,
} from "@/content/theme/site-palette";

/** Lit la palette choisie (cookie), pour que le rendu serveur pose la bonne
 * classe dès le premier HTML envoyé — pas de flash de l'ancienne palette. */
export async function getSitePalette(): Promise<SitePaletteId> {
  const store = await cookies();
  const raw = store.get(SITE_PALETTE_COOKIE)?.value;
  return isSitePaletteId(raw) ? raw : DEFAULT_SITE_PALETTE;
}
