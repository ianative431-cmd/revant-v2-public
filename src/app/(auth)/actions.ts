"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequiredConsentVersions } from "@/server/legal/consent";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_ERROR_MESSAGE,
} from "@/server/security/rate-limit";

export type AuthActionState = { error: string | null };

// --- Validation serveur (jamais seulement côté formulaire) ---

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function isValidPassword(value: string): boolean {
  return value.length >= 8 && value.length <= 128;
}

// Numéro Niger : +227 suivi de 8 chiffres.
function isValidNigerPhone(value: string): boolean {
  return /^\+227\d{8}$/.test(value);
}

/**
 * Construit l'enregistrement de consentement légal à attacher au compte,
 * et vérifie côté serveur que les cases requises ont bien été cochées.
 * Ne fait jamais confiance à un simple état désactivé du bouton côté
 * frontend (voir SECURITY.md).
 */
function buildLegalConsentOrError(formData: FormData) {
  const acceptedCgu = formData.get("acceptCgu") === "on";
  const acceptedConfidentialite = formData.get("acceptConfidentialite") === "on";

  if (!acceptedCgu || !acceptedConfidentialite) {
    return {
      error:
        "Tu dois accepter les Conditions Générales d'Utilisation et la Politique de confidentialité pour créer un compte.",
    } as const;
  }

  return {
    error: null,
    legal_consent: {
      versions: getRequiredConsentVersions(),
      consentedAt: new Date().toISOString(),
      consentType: "inscription" as const,
    },
  } as const;
}

// --- Inscription / connexion par e-mail ---

export async function signUpWithEmail(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email)) {
    return { error: "Adresse e-mail invalide." };
  }
  if (!isValidPassword(password)) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const ip = await getClientIdentifier();
  const [allowedByEmail, allowedByIp] = await Promise.all([
    checkRateLimit(`signup:email:${email}`, 5, 3600),
    checkRateLimit(`signup:ip:${ip}`, 15, 3600),
  ]);
  if (!allowedByEmail || !allowedByIp) {
    return { error: RATE_LIMIT_ERROR_MESSAGE };
  }

  const consentResult = buildLegalConsentOrError(formData);
  if (consentResult.error) return { error: consentResult.error };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { legal_consent: consentResult.legal_consent } },
  });

  if (error) {
    // Message générique : jamais le détail technique renvoyé par Supabase
    // au client (voir SECURITY.md, règle "erreurs serveur").
    return { error: "Impossible de créer le compte. Réessaie plus tard." };
  }

  redirect("/compte");
}

export async function signInWithEmail(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email) || password.length === 0) {
    return { error: "Identifiants invalides." };
  }

  const ip = await getClientIdentifier();
  const [allowedByEmail, allowedByIp] = await Promise.all([
    checkRateLimit(`signin:email:${email}`, 10, 900),
    checkRateLimit(`signin:ip:${ip}`, 30, 900),
  ]);
  if (!allowedByEmail || !allowedByIp) {
    return { error: RATE_LIMIT_ERROR_MESSAGE };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou mot de passe incorrect." };
  }

  redirect("/compte");
}

// --- Connexion / inscription par téléphone (Niger, +227) via Supabase Auth (SMS piloté par Twilio, configuré côté Supabase) ---

export async function sendPhoneOtp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const mode = String(formData.get("mode") ?? "connexion");

  if (!isValidNigerPhone(phone)) {
    return { error: "Numéro invalide. Format attendu : +227XXXXXXXX." };
  }

  // Fenêtre courte et seuil bas : chaque SMS envoyé a un coût réel
  // (Twilio), contrairement aux autres limites de cette page.
  const ip = await getClientIdentifier();
  const [allowedByPhone, allowedByIp] = await Promise.all([
    checkRateLimit(`sms:phone:${phone}`, 3, 600),
    checkRateLimit(`sms:ip:${ip}`, 8, 600),
  ]);
  if (!allowedByPhone || !allowedByIp) {
    return { error: RATE_LIMIT_ERROR_MESSAGE };
  }

  const supabase = await createSupabaseServerClient();

  if (mode === "inscription") {
    const consentResult = buildLegalConsentOrError(formData);
    if (consentResult.error) return { error: consentResult.error };

    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { data: { legal_consent: consentResult.legal_consent } },
    });
    if (error) return { error: "Impossible d'envoyer le code. Réessaie plus tard." };
    return { error: null };
  }

  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) {
    return { error: "Impossible d'envoyer le code. Réessaie plus tard." };
  }

  return { error: null };
}

export async function verifyPhoneOtp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!isValidNigerPhone(phone) || !/^\d{4,8}$/.test(code)) {
    return { error: "Code invalide." };
  }

  // Protection anti-bruteforce du code à 4-8 chiffres : seuil bas,
  // par numéro ciblé (pas seulement par IP, qui peut être partagée
  // sur un réseau mobile).
  const allowedByPhone = await checkRateLimit(`otp-verify:phone:${phone}`, 8, 600);
  if (!allowedByPhone) {
    return { error: RATE_LIMIT_ERROR_MESSAGE };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token: code,
    type: "sms",
  });

  if (error) {
    return { error: "Code incorrect ou expiré." };
  }

  redirect("/compte");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
