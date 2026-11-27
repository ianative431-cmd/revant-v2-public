"use server";

import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_ERROR_MESSAGE } from "@/server/security/rate-limit";
import {
  createAccessKeySalt, createDeviceToken, digestDeviceToken, digestSuperAdminAccessKey,
  hasAal2, hasVerifiedTotp, isSuperAdminUser, normalizeAdminName, safeDigestEqual,
} from "@/server/auth/super-admin";
import { hasRecentSuperAdminAuthMethod } from "@/server/auth/super-admin-proof";

export type SecureAdminState = { error: string | null; success?: boolean };
const genericMessage = "Si l’adresse correspond au compte autorisé, un lien sécurisé vient d’être envoyé. Vérifie ta boîte de réception.";
const genericError = "Identifiants incorrects ou accès non autorisé.";
const DEVICE_COOKIE = process.env.NODE_ENV === "production" ? "__Host-revant-super-admin-device" : "revant-super-admin-device";
const COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
const validName = (v: string) => v.trim().length >= 2 && v.trim().length <= 60;
const validKey = (v: string) => /^[a-f0-9]{64}$/i.test(v);

async function getCurrentSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !(await isSuperAdminUser(user.id))) return null;
  return { supabase, user };
}
async function recentEmailProof(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  return hasRecentSuperAdminAuthMethod(supabase, ["otp", "magiclink"], 30 * 60);
}
async function hasBootstrapClaim(userId: string) {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("super_admin_bootstrap_claims")
    .select("user_id,expires_at").eq("id", 1).eq("user_id", userId).maybeSingle();
  return !error && Boolean(data && Date.parse(data.expires_at) > Date.now());
}
async function checkLimits(prefix: string, userOrEmail: string, perUser: number, ipLimit: number, windowSeconds: number) {
  const ip = await getClientIdentifier();
  const checks = [checkRateLimit(prefix + ":" + userOrEmail, perUser, windowSeconds)];
  if (ip !== "unknown") checks.push(checkRateLimit(prefix + ":ip:" + ip, ipLimit, windowSeconds));
  return (await Promise.all(checks)).every(Boolean);
}

export async function requestInitialSuperAdminEmail(_prev: SecureAdminState, formData: FormData): Promise<SecureAdminState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!validEmail(email)) return { error: "Adresse e-mail invalide." };
  if (!(await checkLimits("super-admin-bootstrap-email", email, 3, 8, 3600))) return { error: RATE_LIMIT_ERROR_MESSAGE };
  const supabase = await createSupabaseServerClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://revant-v2-ui-premium.onrender.com").replace(/\/+$/, "");
  await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: siteUrl + "/auth/callback?next=%2Fadmin-connexion%2Finitialiser",
    },
  });
  return { error: null, success: true };
}

export async function continueInitialSuperAdminBootstrap(_prev: SecureAdminState, _formData: FormData): Promise<SecureAdminState> {
  const current = await getCurrentSuperAdmin();
  if (!current || !current.user.email_confirmed_at || !(await recentEmailProof(current.supabase))) return { error: genericError };
  if (!(await checkLimits("super-admin-bootstrap-continue", current.user.id, 8, 15, 900))) return { error: RATE_LIMIT_ERROR_MESSAGE };
  const db = createSupabaseAdminClient();
  const { count, error } = await db.from("super_admin_identities").select("user_id", { count: "exact", head: true });
  if (error || (count ?? 0) > 0) return { error: "La première configuration est déjà terminée." };
  const { data: claimed, error: claimError } = await db.rpc("claim_super_admin_bootstrap", {
    p_user_id: current.user.id,
    p_expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  });
  if (claimError || claimed !== true) return { error: "Une autre initialisation est déjà réservée. Réessaie après son expiration." };
  if (!(await hasVerifiedTotp(current.supabase))) redirect("/admin-connexion/securite");
  redirect("/admin-connexion/mfa?next=setup");
}

export async function beginBootstrapTotpEnrollment() {
  const current = await getCurrentSuperAdmin();
  if (!current || !(await recentEmailProof(current.supabase)) || !(await hasBootstrapClaim(current.user.id))) {
    return { error: "La preuve e-mail ou la réservation d’initialisation a expiré." };
  }
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

export async function verifyBootstrapTotpEnrollment(_prev: SecureAdminState, formData: FormData): Promise<SecureAdminState> {
  const factorId = String(formData.get("factorId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (!factorId || !/^\d{6,8}$/.test(code)) return { error: "Code invalide." };
  const current = await getCurrentSuperAdmin();
  if (!current || !(await recentEmailProof(current.supabase)) || !(await hasBootstrapClaim(current.user.id))) {
    return { error: "La preuve e-mail ou la réservation a expiré. Recommence l’initialisation." };
  }
  if (!(await checkLimits("super-admin-bootstrap-totp", current.user.id, 5, 10, 900))) return { error: RATE_LIMIT_ERROR_MESSAGE };
  const { data: challenge, error: challengeError } = await current.supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challenge) return { error: "Impossible de vérifier le code." };
  const { error } = await current.supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (error || !(await hasAal2(current.supabase))) return { error: "Code incorrect ou authentification renforcée non confirmée." };
  redirect("/admin-connexion/configurer");
}

export async function configureInitialSuperAdminIdentity(_prev: SecureAdminState, formData: FormData): Promise<SecureAdminState> {
  const username = String(formData.get("username") ?? "").trim();
  const key = String(formData.get("accessKey") ?? "");
  const confirmation = String(formData.get("accessKeyConfirmation") ?? "");
  const deviceName = String(formData.get("deviceName") ?? "").trim();
  if (!validName(username) || !validKey(key) || key !== confirmation || deviceName.length < 2 || deviceName.length > 80) {
    return { error: "Vérifie le nom, la clé de 64 caractères et sa confirmation." };
  }
  const current = await getCurrentSuperAdmin();
  if (!current || !(await recentEmailProof(current.supabase)) || !(await hasAal2(current.supabase)) || !(await hasBootstrapClaim(current.user.id))) {
    return { error: "La preuve e-mail récente, la réservation et le second facteur sont obligatoires." };
  }
  const db = createSupabaseAdminClient();
  const { count, error: countError } = await db.from("super_admin_identities").select("user_id", { count: "exact", head: true });
  if (countError || (count ?? 0) > 0) return { error: "La première configuration est déjà terminée." };

  const { error: authError } = await current.supabase.auth.updateUser({ password: key });
  if (authError) return { error: "Impossible d’enregistrer la clé dans Supabase Auth. Réessaie." };

  const token = createDeviceToken();
  const { data: device, error: deviceError } = await db.from("super_admin_devices").insert({
    user_id: current.user.id, device_name: deviceName, device_token_digest: digestDeviceToken(token),
    status: "approved", approved_at: new Date().toISOString(), last_seen_at: new Date().toISOString(),
  }).select("id").single();
  if (deviceError || !device) return { error: "La clé Auth est enregistrée, mais le premier appareil n’a pas pu être créé. Réessaie avec la même clé." };

  const salt = createAccessKeySalt();
  const { error: identityError } = await db.from("super_admin_identities").insert({
    user_id: current.user.id, first_name: username, last_name: "Super Admin",
    first_name_normalized: normalizeAdminName(username), last_name_normalized: normalizeAdminName("Super Admin"),
    access_key_salt: salt, access_key_digest: digestSuperAdminAccessKey(key, salt),
  });
  if (identityError) {
    await db.from("super_admin_devices").delete().eq("id", device.id);
    return { error: "La clé Auth est enregistrée, mais l’identité n’a pas pu être créée. Réessaie avec la même clé." };
  }
  await db.rpc("release_super_admin_bootstrap", { p_user_id: current.user.id });
  (await cookies()).set(DEVICE_COOKIE, token, COOKIE_OPTIONS);
  await current.supabase.auth.signOut();
  redirect("/admin-connexion?configured=1");
}

export async function requestSuperAdminKeyRecovery(_prev: SecureAdminState, formData: FormData): Promise<SecureAdminState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!validEmail(email)) return { error: "Adresse e-mail invalide." };
  if (!(await checkLimits("super-admin-recovery-email", email, 3, 8, 3600))) return { error: RATE_LIMIT_ERROR_MESSAGE };
  const supabase = await createSupabaseServerClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://revant-v2-ui-premium.onrender.com").replace(/\/+$/, "");
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: siteUrl + "/auth/callback?next=%2Fadmin-connexion%2Frecuperer-cle",
  });
  return { error: null, success: true };
}

export async function verifySuperAdminRecoveryMfa(_prev: SecureAdminState, formData: FormData): Promise<SecureAdminState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6,8}$/.test(code)) return { error: "Code invalide." };
  const current = await getCurrentSuperAdmin();
  if (!current || !(await hasRecentSuperAdminAuthMethod(current.supabase, ["recovery"], 30 * 60))) return { error: "Le lien de récupération est invalide ou expiré." };
  if (!(await hasVerifiedTotp(current.supabase))) return { error: "Aucun facteur TOTP vérifié. L’e-mail seul ne permet pas de contourner le second facteur." };
  if (!(await checkLimits("super-admin-recovery-mfa", current.user.id, 5, 10, 900))) return { error: RATE_LIMIT_ERROR_MESSAGE };
  const { data: factors, error: factorsError } = await current.supabase.auth.mfa.listFactors();
  if (factorsError || !factors) return { error: "Impossible de vérifier les facteurs de sécurité." };
  const factor = factors.totp.find((item) => item.status === "verified");
  if (!factor) return { error: "Aucun facteur TOTP vérifié n’est disponible." };
  const { data: challenge, error: challengeError } = await current.supabase.auth.mfa.challenge({ factorId: factor.id });
  if (challengeError || !challenge) return { error: "Impossible de vérifier le code." };
  const { error } = await current.supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code });
  if (error || !(await hasAal2(current.supabase))) return { error: "Code incorrect ou authentification renforcée non confirmée." };
  redirect("/admin-connexion/recuperer-cle");
}

export async function rotateSuperAdminAccessKey(_prev: SecureAdminState, formData: FormData): Promise<SecureAdminState> {
  const key = String(formData.get("accessKey") ?? "");
  const confirmation = String(formData.get("accessKeyConfirmation") ?? "");
  if (!validKey(key) || key !== confirmation) return { error: "La nouvelle clé doit contenir 64 caractères hexadécimaux identiques à la confirmation." };
  const current = await getCurrentSuperAdmin();
  if (!current || !(await hasRecentSuperAdminAuthMethod(current.supabase, ["recovery"], 30 * 60)) ||
      !(await hasAal2(current.supabase)) || !(await hasVerifiedTotp(current.supabase))) {
    return { error: "Une récupération e-mail récente et la validation TOTP sont obligatoires." };
  }
  if (!(await checkLimits("super-admin-key-rotation", current.user.id, 3, 6, 900))) return { error: RATE_LIMIT_ERROR_MESSAGE };

  const db = createSupabaseAdminClient();
  const { data: existing, error: readError } = await db.from("super_admin_key_rotation_pending")
    .select("operation_id,access_key_salt,access_key_digest,expires_at").eq("user_id", current.user.id).maybeSingle();
  if (readError) return { error: "Impossible de vérifier l’opération en attente." };

  let operationId: string;
  let salt: string;
  let digest: string;
  if (existing && Date.parse(existing.expires_at) > Date.now()) {
    if (!safeDigestEqual(digestSuperAdminAccessKey(key, existing.access_key_salt), existing.access_key_digest)) {
      return { error: "Une rotation est déjà en cours. Réutilise exactement la même clé jusqu’à la fin ou à son expiration." };
    }
    operationId = existing.operation_id;
    salt = existing.access_key_salt;
    digest = existing.access_key_digest;
  } else {
    operationId = randomUUID();
    salt = createAccessKeySalt();
    digest = digestSuperAdminAccessKey(key, salt);
    const { data: started, error: beginError } = await db.rpc("begin_super_admin_key_rotation", {
      p_user_id: current.user.id, p_operation_id: operationId,
      p_access_key_salt: salt, p_access_key_digest: digest,
      p_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    if (beginError || started !== true) return { error: "Une autre rotation est en cours ou la préparation a échoué. Réessaie avec la même clé." };
  }

  const { error: authError } = await current.supabase.auth.updateUser({ password: key });
  if (authError) return { error: "Supabase Auth n’a pas confirmé la nouvelle clé. Conserve cette clé et réessaie avant l’expiration." };
  const { data: finalized, error: finalizeError } = await db.rpc("finalize_super_admin_key_rotation", {
    p_user_id: current.user.id, p_operation_id: operationId,
  });
  let completed = !finalizeError && finalized === true;
  if (!completed) {
    const { data: identity } = await db.from("super_admin_identities")
      .select("access_key_salt,access_key_digest").eq("user_id", current.user.id).maybeSingle();
    completed = Boolean(identity && safeDigestEqual(digestSuperAdminAccessKey(key, identity.access_key_salt), identity.access_key_digest));
  }
  if (!completed) return { error: "La clé Auth a été mise à jour, mais la validation de son empreinte reste en attente. Réutilise exactement la même clé avant l’expiration pour reprendre." };

  const { error: auditError } = await db.from("admin_actions").insert({
    admin_id: current.user.id, action: "super_admin_access_key_rotated",
    target_type: "super_admin_identity", target_id: current.user.id,
    reason: "Rotation après récupération e-mail et validation TOTP",
    metadata: { method: "email_recovery_totp" },
  });
  if (auditError) console.error("[super-admin-recovery] audit insert failed", auditError.message);
  await current.supabase.auth.signOut();
  redirect("/admin-connexion?key=updated");
}
