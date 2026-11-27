import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Verify a recent signed Supabase Auth method claim, never client-editable metadata. */
export async function hasRecentSuperAdminAuthMethod(
  supabase: ServerSupabase,
  allowedMethods: readonly string[],
  maxAgeSeconds = 30 * 60
): Promise<boolean> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return false;
  const claims = data.claims as unknown as { amr?: Array<{ method?: unknown; timestamp?: unknown }> };
  if (!Array.isArray(claims.amr)) return false;
  const now = Math.floor(Date.now() / 1000);
  return claims.amr.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    if (typeof entry.method !== "string" || !allowedMethods.includes(entry.method)) return false;
    if (typeof entry.timestamp !== "number" || !Number.isFinite(entry.timestamp)) return false;
    return entry.timestamp <= now + 30 && now - entry.timestamp <= maxAgeSeconds;
  });
}
