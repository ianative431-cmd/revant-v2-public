export const COOKIE_CONSENT_NAME = "revant_consent";
// Incrémenter cette valeur si les catégories proposées changent, pour
// forcer un nouveau passage devant la bannière.
export const COOKIE_CONSENT_SHAPE_VERSION = "1";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 182; // ~6 mois

export type CookieCategories = {
  necessary: true; // toujours actif, non désactivable
  analytics: boolean;
  personalization: boolean;
  advertising: boolean;
};

export type CookieConsentRecord = {
  shapeVersion: string;
  categories: CookieCategories;
  consentType: "accept_all" | "reject_non_essential" | "custom";
  consentedAt: string; // ISO
};

export function defaultCategories(allNonEssential: boolean): CookieCategories {
  return {
    necessary: true,
    analytics: allNonEssential,
    personalization: allNonEssential,
    advertising: allNonEssential,
  };
}

export function parseConsentCookie(raw: string | undefined | null): CookieConsentRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (parsed && parsed.shapeVersion === COOKIE_CONSENT_SHAPE_VERSION && parsed.categories) {
      return parsed as CookieConsentRecord;
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeConsentCookieValue(record: CookieConsentRecord): string {
  return encodeURIComponent(JSON.stringify(record));
}

/** Écrit le cookie côté navigateur (utilisé par la bannière flottante). */
export function writeConsentCookieClient(record: CookieConsentRecord) {
  const value = serializeConsentCookieValue(record);
  document.cookie = `${COOKIE_CONSENT_NAME}=${value}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function readConsentCookieClient(): CookieConsentRecord | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_CONSENT_NAME}=`));
  if (!match) return null;
  return parseConsentCookie(match.split("=")[1]);
}

export const COOKIE_CATEGORY_LABELS: Record<keyof CookieCategories, { label: string; description: string }> = {
  necessary: {
    label: "Strictement nécessaires",
    description: "Indispensables au fonctionnement du service (session, sécurité). Toujours actifs.",
  },
  analytics: {
    label: "Analytiques",
    description: "Mesure d'audience anonymisée pour comprendre et améliorer l'usage de Revant.",
  },
  personalization: {
    label: "Personnalisation",
    description: "Mémorisation de préférences d'affichage.",
  },
  advertising: {
    label: "Publicité",
    description: "Mesure ou personnalisation de contenus publicitaires, le cas échéant.",
  },
};

/** Cookie MAX_AGE exporté pour réutilisation côté serveur (Route Handler / Server Action). */
export const COOKIE_CONSENT_MAX_AGE_SECONDS = MAX_AGE_SECONDS;
