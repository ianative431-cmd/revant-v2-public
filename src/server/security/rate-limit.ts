import "server-only";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Limitation de taux côté serveur, adossée à la fonction Postgres
 * atomique check_rate_limit() (archive supabase/legacy_migrations_archive/0011_rate_limiting.sql).
 *
 * Pourquoi en base plutôt qu'en mémoire : Render peut faire tourner
 * plusieurs instances et redémarre régulièrement (déploiements,
 * veille) — un compteur en mémoire reviendrait à zéro à chaque
 * redémarrage et ne serait pas partagé entre instances, donc
 * n'empêcherait rien en pratique. La table Postgres est la seule
 * source de vérité partagée déjà disponible dans ce projet.
 *
 * Utilise le client service role : la table rate_limit_attempts n'a
 * aucune policy RLS, donc aucun autre chemin ne peut la lire/écrire.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  // Hash every key so e-mail addresses, phone numbers and IP addresses
  // are never stored in plaintext in the rate-limit table.
  const hashedKey = createHash("sha256").update(key).digest("hex");
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: hashedKey,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    // Fail closed: si la protection partagée ne répond plus, on refuse
    // temporairement les opérations sensibles plutôt que de désactiver
    // la défense contre le brute force.
    console.error("[rate-limit] vérification impossible :", error.message);
    return false;
  }

  return data === true;
}

/**
 * Identifiant réseau de confiance pour Render.
 * Préfère CF-Connecting-IP, ajouté par Cloudflare, puis utilise le premier
 * X-Forwarded-For valide conformément à la documentation Render.
 * Si aucun en-tête exploitable n'est présent, les limites par compte/téléphone
 * restent actives sans créer une clé IP globale "unknown".
 */
export async function getClientIdentifier(): Promise<string> {
  const headerList = await headers();
  const cloudflareIp = headerList.get("cf-connecting-ip")?.trim() ?? "";
  if (isIP(cloudflareIp)) return cloudflareIp;

  const forwardedFor = headerList.get("x-forwarded-for") ?? "";
  const firstForwardedIp = forwardedFor.split(",")[0]?.trim() ?? "";
  return isIP(firstForwardedIp) ? firstForwardedIp : "unknown";
}

/** Message d'erreur générique affiché à l'utilisateur en cas de blocage
 * — jamais de détail sur le mécanisme de limitation (voir SECURITY.md,
 * règle "erreurs serveur"). */
export const RATE_LIMIT_ERROR_MESSAGE =
  "Trop de tentatives. Réessaie dans quelques minutes.";
