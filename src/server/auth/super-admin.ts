import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;
export function normalizeAdminName(value: string) { return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("fr"); }
export function createAccessKeySalt() { return randomBytes(24).toString("hex"); }
// The access key is a separate 256-bit secret; the account password is handled only by Supabase Auth.
export function digestSuperAdminAccessKey(key: string, salt: string) { return createHash("sha256").update(salt).update(":").update(key.normalize("NFKC")).digest("hex"); }
export function createDeviceToken() { return randomBytes(32).toString("base64url"); }
export function digestDeviceToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function safeDigestEqual(a: string, b: string) { return /^[a-f0-9]{64}$/i.test(a) && /^[a-f0-9]{64}$/i.test(b) && timingSafeEqual(Buffer.from(a,"hex"),Buffer.from(b,"hex")); }
export async function isSuperAdminUser(userId: string) { const db=createSupabaseAdminClient(); const {data,error}=await db.from("user_roles").select("role").eq("user_id",userId); return !error && Boolean(data?.some((r)=>r.role==="super_admin")); }
export async function hasVerifiedTotp(supabase: ServerSupabase) { const {data,error}=await supabase.auth.mfa.listFactors(); return !error && Boolean(data?.totp.some((f)=>f.status==="verified")); }
export async function hasAal2(supabase: ServerSupabase) { const {data,error}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel(); return !error && data.currentLevel==="aal2"; }
function getSessionIdFromAccessToken(accessToken: string): string | null {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { session_id?: unknown };
    return typeof claims.session_id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(claims.session_id)
      ? claims.session_id
      : null;
  } catch {
    return null;
  }
}

export async function isTrustedSuperAdminDevice(userId: string) {
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Host-revant-super-admin-device"
    : "revant-super-admin-device";
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return false;

  const supabase = await createSupabaseServerClient();
  const [{ data: { user }, error: userError }, { data: { session }, error: sessionError }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);
  if (userError || sessionError || !user || user.id !== userId || !session || session.user.id !== userId) {
    return false;
  }

  const sessionId = getSessionIdFromAccessToken(session.access_token);
  if (!sessionId) return false;

  const db = createSupabaseAdminClient() as unknown as SupabaseClient;
  const { data, error } = await db
    .from("super_admin_devices")
    .select("id")
    .eq("user_id", userId)
    .eq("device_token_digest", digestDeviceToken(token))
    .eq("status", "approved")
    .maybeSingle();

  if (error || !data) return false;

  const { error: updateError } = await db
    .from("super_admin_devices")
    .update({
      last_seen_at: new Date().toISOString(),
      session_id: sessionId,
    })
    .eq("id", data.id)
    .eq("status", "approved");

  return !updateError;
}
