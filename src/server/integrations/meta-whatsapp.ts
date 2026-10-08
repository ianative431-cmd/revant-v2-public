import "server-only";
import crypto from "node:crypto";

/**
 * Tout ce qui parle réellement au Graph API de Meta pour l'intégration
 * WhatsApp Business (Embedded Signup). Isolé dans ce fichier car c'est
 * la partie la plus susceptible de devoir être ajustée une fois
 * connectée à un vrai compte Meta Business (noms de champs, version
 * d'API) — le reste du code (DB, page admin, audit) n'a pas à changer
 * si un détail d'appel évolue ici.
 *
 * Aucune valeur simulée : chaque fonction fait un vrai appel HTTP et
 * laisse remonter l'erreur telle quelle si Meta répond autre chose
 * qu'un succès.
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Configuration Meta manquante : la variable d'environnement ${name} n'est pas définie.`
    );
  }
  return value;
}

export class MetaGraphError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly graphError?: unknown
  ) {
    super(message);
    this.name = "MetaGraphError";
  }
}

async function graphFetch(path: string, searchParams?: Record<string, string>) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body
        ? (body as { error?: { message?: string } }).error?.message
        : null) ?? `Erreur Meta Graph API (${res.status})`;
    throw new MetaGraphError(message, res.status, body);
  }
  return body;
}

/**
 * Échange le `code` renvoyé par l'Embedded Signup (côté client, via
 * FB.login) contre un token d'accès utilisateur. Le `code` de
 * l'Embedded Signup JS SDK n'est pas lié à une redirect_uri.
 */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  expiresIn: number | null;
}> {
  const appId = requireEnv("META_APP_ID");
  const appSecret = requireEnv("META_APP_SECRET");

  const data = (await graphFetch("/oauth/access_token", {
    client_id: appId,
    client_secret: appSecret,
    code,
  })) as { access_token?: string; expires_in?: number };

  if (!data.access_token) {
    throw new MetaGraphError("Aucun token renvoyé par Meta pour ce code.", 502, data);
  }

  return { accessToken: data.access_token, expiresIn: data.expires_in ?? null };
}

/**
 * Liste les comptes WhatsApp Business (WABA) rattachés au Business
 * du token donné, via le Business Portfolio. Retourne le premier
 * trouvé (cas nominal : un seul compte existant à relier — voir
 * contrainte "ne pas créer de nouveau compte").
 */
export async function getFirstOwnedWaba(
  accessToken: string,
  businessId: string
): Promise<{ wabaId: string; businessName: string | null }> {
  const data = (await graphFetch(`/${businessId}/owned_whatsapp_business_accounts`, {
    access_token: accessToken,
  })) as { data?: Array<{ id: string; name?: string }> };

  const first = data.data?.[0];
  if (!first) {
    throw new MetaGraphError(
      "Aucun compte WhatsApp Business trouvé pour ce Business Meta.",
      404
    );
  }
  return { wabaId: first.id, businessName: first.name ?? null };
}

/** Numéro professionnel (phone_number_id) rattaché à un WABA. */
export async function getFirstPhoneNumber(
  accessToken: string,
  wabaId: string
): Promise<{ phoneNumberId: string; displayNumber: string | null } | null> {
  const data = (await graphFetch(`/${wabaId}/phone_numbers`, {
    access_token: accessToken,
  })) as { data?: Array<{ id: string; display_phone_number?: string }> };

  const first = data.data?.[0];
  if (!first) return null;
  return { phoneNumberId: first.id, displayNumber: first.display_phone_number ?? null };
}

/**
 * Vérification réelle de la connexion : confirme que le token est
 * toujours valide en interrogeant le WABA lui-même (pas juste "la
 * variable existe").
 */
export async function verifyWabaAccess(
  accessToken: string,
  wabaId: string
): Promise<{ ok: true; name: string | null } | { ok: false; error: string }> {
  try {
    const data = (await graphFetch(`/${wabaId}`, {
      access_token: accessToken,
      fields: "id,name",
    })) as { name?: string };
    return { ok: true, name: data.name ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

/**
 * Confirme côté Meta que l'app Revant est bien abonnée aux
 * webhooks de ce WABA — le vrai test demandé, pas une simple
 * vérification locale du point de terminaison.
 */
export async function getSubscribedApps(
  accessToken: string,
  wabaId: string
): Promise<Array<{ whatsappBusinessApiData?: { id?: string; name?: string } }>> {
  const data = (await graphFetch(`/${wabaId}/subscribed_apps`, {
    access_token: accessToken,
  })) as { data?: Array<{ whatsapp_business_api_data?: { id?: string; name?: string } }> };

  return (data.data ?? []).map((entry) => ({
    whatsappBusinessApiData: entry.whatsapp_business_api_data,
  }));
}

/**
 * Vérifie la signature HMAC-SHA256 d'un webhook entrant (header
 * `X-Hub-Signature-256`) avec le App Secret. Rejette tout ce qui ne
 * correspond pas — jamais de traitement d'un webhook non vérifié.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return false;

  const expected = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(provided, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
