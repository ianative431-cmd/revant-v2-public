"use server";

import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CookieConsentRecord } from "@/lib/cookie-consent";

/**
 * Best-effort : si un utilisateur est connecté au moment où il fait un
 * choix de cookies, on garde une trace du dernier choix sur son compte
 * (métadonnées Supabase Auth), en plus du cookie qui reste la source de
 * vérité technique pour l'affichage/le blocage des scripts. Silencieux
 * en cas d'échec — ne doit jamais bloquer l'expérience utilisateur.
 */
export async function recordCookieConsentForAccount(record: CookieConsentRecord) {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.updateUser({
      data: { last_cookie_consent: record },
    });
  } catch {
    // volontairement silencieux
  }
}
