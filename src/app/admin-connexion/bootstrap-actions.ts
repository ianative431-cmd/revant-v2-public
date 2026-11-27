"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_ERROR_MESSAGE } from "@/server/security/rate-limit";
import {
  createAccessKeySalt, createDeviceToken, digestDeviceToken, digestSuperAdminAccessKey,
  hasAal2, hasVerifiedTotp, isSuperAdminUser, normalizeAdminName,
} from "@/server/auth/super-admin";
import { hasRecentSuperAdminAuthMethod } from "@/server/auth/super-admin-proof";

export type BootstrapState = { error: string | null; success?: boolean };
const DEVICE_COOKIE = process.env.NODE_ENV === "production" ? "__Host-revant-super-admin-device" : "revant-super-admin-device";
const DEVICE_COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
const validName = (v: string) => v.trim().length >= 2 && v.trim().length <= 60;
const validKey = (v: string) => /^[a-f0-9]{64}$/i.test(v);

async function currentSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !(await isSuperAdminUser(user.id))) return null;
  return { supabase, user };
}

async function hasBootstrapClaim(userId: string) {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("super_admin_bootstrap_claims").select("user_id").eq("id", 1).maybeSingle();
  return !error && data?.user_id === userId;
}

async function claimBootstrap(userId: string) {
  const db = createSupabaseAdminClient();
  const { error } = await db.from("super_admin_bootstrap_claims").insert({ id: 1, user_id: userId });
  if (!error) return true;
  return hasBootstrapClaim(userId);
}

export async function requestInitialSuperAdminEmail(_prev: BootstrapState, formData: FormData): Promise<BootstrapState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!validEmail(email)) return { error: "Adresse e-mail invalide." };
  const ip = await getClientIdentifier();
  const checks = [checkRateLimit(`super-admin-bootstrap-email:${email}`, 3, 3600)];
  if (ip !== "unknown") checks.push(checkRateLimit(`super-admin-bootstrap-email:ip:${ip}`, 8, 3600));
  if ((await Promise.all(checks)).some((allowed) => !allowed)) return { error: RATE_LIMIT_ERROR_MESSAGE };
  const supabase = await createSupabaseServerClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://revant-v2-ui-premium.onrender.com").replace(/\/+$/, "");
  await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl}/auth/callback?next=%2Fadmin-connexion%2Finitialiser` },
  });
  return { error: null, success: true };
}

export async function continueInitialSuperAdminBootstrap(_prev: BootstrapState, _formData: FormData): Promise<BootstrapState> {
  const current = await currentSuperAdmin();
  if (!current || !current.user.email_confirmed_at ||
      !(await hasRecentSuperAdminAuthMethod(current.supabase, ["otp", "magiclink"], 30 * 60))) {
    return { error: "Ouvre d’abord le lien reçu par e-mail sur cet appareil, puis reviens ici." };
  }
  const ip = await getClientIdentifier();
  const checks = [checkRateLimit(`super-admin-bootstrap-continue:${current.user.id}`, 8, 900)];
  if (ip !== "unknown") checks.push(checkRateLimit(`super-admin-bootstrap-continue:ip:${ip}`, 15, 900));
  if ((await Promise.all(checks)).some((allowed) => !allowed)) return { error: RATE_LIMIT_ERROR_MESSAGE };
  const db = createSupabaseAdminClient();
  const { count, error } = await db.from("super_admin_identities").select("user_id", { count: "exact", head: true });
  if (error || (count ?? 0) > 0) return { error: "La première configuration est déjà terminée." };
  if (!(await claimBootstrap(current.user.id))) return { error: "Une autre initialisation du Super Admin est déjà réservée." };
  if (!(await hasVerifiedTotp(current.supabase))) redirect("/admin-connexion/securite");
  redirect("/admin-connexion/mfa?next=setup");
}

export async function beginBootstrapTotpEnrollment() {
  const current = await currentSuperAdmin();
  if (!current || !(await hasRecentSuperAdminAuthMethod(current.supabase, ["otp", "magiclink"], 30 * 60))) {
    return { error: "Une preuve récente de possession de l’e-mail est requise." };
  }
  if (!(await hasBootstrapClaim(current.user.id))) return { error: "L’initialisation n’est pas réservée à ce compte." };
  const { data: factors, error: factorsError } = await current.supabase.auth.mfa.listFactors();
  if (factorsError || !factors) return { error: "Impossible de vérifier les facteurs de sécurité." };
  const verified = factors.totp.find((factor) => factor.status === "verified");
  if (verified) return { error: null, factorId: verified.id, qrCode: null, secret: null, alreadyVerified: true };
  for (const factor of factors.all.filter((item) => item.factor_type === "totp" && item.status === "unverified")) {
    await current.supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  const { data, error } = await current.supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Revant Super Admin" });
  if (error || !data?.totp) return { error: "Impossible de préparer l’authentification à deux facteurs." };
  return { error: null, factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret, alreadyVerified: false };
}

export async function verifyBootstrapTotpEnrollment(_prev: BootstrapState, formData: FormData): Promise<BootstrapState> {
  const factorId = String(formData.get("factorId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (!factorId || !/^\d{6,8}$/.test(code)) return { error: "Code invalide." };
  const current = await currentSuperAdmin();
  if (!current || !(await hasRecentSuperAdminAuthMethod(current.supabase, ["otp", "magiclink"], 30 * 60)) ||
      !(await hasBootstrapClaim(current.user.id))) return { error: "La preuve e-mail ou la réservation d’initialisation a expiré." };
  const ip = await getClientIdentifier();
  const checks = [checkRateLimit(`super-admin-bootstrap-totp:${current.user.id}`, 5, 900)];
  if (ip !== "unknown") checks.push(checkRateLimit(`super-admin-bootstrap-totp:ip:${ip}`, 10, 900));
  if ((await Promise.all(checks)).some((allowed) => !allowed)) return { error: RATE_LIMIT_ERROR_MESSAGE };
  const { data: challenge, error: challengeError } = await current.supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challenge) return { error: "Impossible de vérifier le code." };
  const { error } = await current.supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (error || !(await hasAal2(current.supabase))) return { error: "Code incorrect ou authentification renforcée non confirmée." };
  redirect("/admin-connexion/configurer");
}

export async function configureInitialSuperAdminIdentity(_prev: BootstrapState, formData: FormData): Promise<BootstrapState> {
  const username = String(formData.get("username") ?? "").trim();
  const key = String(formData.get("accessKey") ?? "");
  const confirmation = String(formData.get("accessKeyConfirmation") ?? "");
  const deviceName = String(formData.get("deviceName") ?? "").trim();
  if (!validName(username) || !validKey(key) || key !== confirmation || deviceName.length < 2 || deviceName.length > 80) {
    return { error: "Vérifie le nom d’utilisateur, la clé de 64 caractères et sa confirmation." };
  }
  const current = await currentSuperAdmin();
  if (!current || !(await hasAal2(current.supabase)) ||
      !(await hasRecentSuperAdminAuthMethod(current.supabase, ["otp", "magiclink"], 30 * 60)) ||
      !(await hasBootstrapClaim(current.user.id))) {
    return { error: "La preuve e-mail récente, la réservation et l’authentification renforcée sont requises." };
  }
  const db = createSupabaseAdminClient();
  const { count, error: countError } = await db.from("super_admin_identities").select("user_id", { count: "exact", head: true });
  if (countError || (count ?? 0) > 0) return { error: "La première configuration est déjà terminée." };

  // Supabase Auth is updated first. An interrupted DB insert can be retried through the email bootstrap.
  const { error: passwordError } = await current.supabase.auth.updateUser({ password: key });
  if (passwordError) return { error: "Impossible d’enregistrer la clé dans Supabase Auth. Réessaie." };
  await db.from("super_admin_devices").delete().eq("user_id", current.user.id);
  const token = createDeviceToken();
  const { data: device, error: deviceError } = await db.from("super_admin_devices").insert({
    user_id: current.user.id, device_name: deviceName, device_token_digest: digestDeviceToken(token),
    status: "approved", approved_at: new Date().toISOString(), last_seen_at: new Date().toISOString(),
  }).select("id").single();
  if (deviceError || !device) return { error: "La clé Auth est enregistrée, mais l’appareil n’a pas pu être créé. Réessaie." };

  const salt = createAccessKeySalt();
  const { error: identityError } = await db.from("super_admin_identities").insert({
    user_id: current.user.id, first_name: username, last_name: "Super Admin",
    first_name_normalized: normalizeAdminName(username), last_name_normalized: normalizeAdminName("Super Admin"),
    access_key_salt: salt, access_key_digest: digestSuperAdminAccessKey(key, salt),
  });
  if (identityError) {
    await db.from("super_admin_devices").delete().eq("id", device.id);
    return { error: "La clé Auth est enregistrée, mais l’identité n’a pas pu être créée. Réessaie." };
  }
  (await cookies()).set(DEVICE_COOKIE, token, DEVICE_COOKIE_OPTIONS);
  await current.supabase.auth.signOut();
  redirect("/admin-connexion?configured=1");
}
