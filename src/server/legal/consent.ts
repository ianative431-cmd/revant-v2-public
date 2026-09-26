import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { requireUser } from "@/server/auth/session";
import { LEGAL_DOCUMENTS } from "@/content/legal/documents";

/**
 * Versions actuellement en vigueur des documents nécessitant un
 * consentement explicite (CGU, Confidentialité). Ces valeurs sont
 * dérivées automatiquement de la source unique (`LEGAL_DOCUMENTS`) —
 * il suffit d'incrémenter la `version` d'un document là-bas pour que
 * tout utilisateur ayant accepté une version antérieure soit
 * automatiquement invité à re-consentir.
 */
export function getRequiredConsentVersions() {
  const versions: Record<string, string> = {};
  for (const doc of LEGAL_DOCUMENTS) {
    if (doc.requiresExplicitConsent) versions[doc.slug] = doc.version;
  }
  return versions; // ex: { cgu: "1.0.0", confidentialite: "1.0.0" }
}

export type LegalConsentRecord = {
  versions: Record<string, string>; // { cgu: "1.0.0", confidentialite: "1.0.0" }
  consentedAt: string; // ISO
  consentType: "inscription" | "reconsentement";
};

/**
 * Lit le consentement légal stocké sur le compte (métadonnées Supabase
 * Auth). Aucune table dédiée n'existe encore pour ceci — voir
 * README.md de ce dossier pour la suite prévue (Étape 3 et au-delà).
 */
export function getLegalConsent(user: User): LegalConsentRecord | null {
  const raw = user.user_metadata?.legal_consent;
  if (!raw || typeof raw !== "object") return null;
  return raw as LegalConsentRecord;
}

/**
 * Vrai si l'utilisateur a accepté la version actuellement en vigueur
 * de CHAQUE document exigeant un consentement explicite.
 */
export function hasCurrentLegalConsent(user: User): boolean {
  const consent = getLegalConsent(user);
  if (!consent) return false;

  const required = getRequiredConsentVersions();
  return Object.entries(required).every(
    ([slug, version]) => consent.versions[slug] === version
  );
}

/**
 * À utiliser à la place de requireUser() sur toute page qui doit
 * garantir un consentement légal à jour (ex. page compte). Redirige
 * vers /legal/reconsentement si une politique a été mise à jour depuis
 * le dernier accord de l'utilisateur.
 */
export async function requireUserWithLegalConsent() {
  const user = await requireUser();
  if (!hasCurrentLegalConsent(user)) {
    redirect("/legal/reconsentement");
  }
  return user;
}
