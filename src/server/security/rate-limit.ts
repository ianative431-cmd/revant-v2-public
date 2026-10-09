import "server-only";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Limitation de taux côté serveur, adossée à la fonction Postgres
 * atomique check_rate_limit() (migration 0011_rate_limiting.sql).
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
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    // Si la vérification elle-même échoue (ex. panne base), on choisit
    // de laisser passer plutôt que de bloquer tout le monde — une
    // panne de rate limiting ne doit pas devenir un déni de service.
    // L'erreur reste journalisée côté serveur pour diagnostic.
    console.error("[rate-limit] vérification impossible :", error.message);
    return true;
  }

  return data === true;
}

/**
 * Identifiant réseau du visiteur, pour les clés de rate limit qui ne
 * dépendent pas d'un compte (ex. tentatives de connexion avant
 * authentification). x-forwarded-for peut contenir plusieurs IP
 * (proxy, CDN) : on garde la première, celle du client d'origine.
 * Valeur de repli si l'en-tête est absent (jamais de clé vide).
 */
export async function getClientIdentifier(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return headerList.get("x-real-ip") ?? "unknown";
}

/** Message d'erreur générique affiché à l'utilisateur en cas de blocage
 * — jamais de détail sur le mécanisme de limitation (voir SECURITY.md,
 * règle "erreurs serveur"). */
export const RATE_LIMIT_ERROR_MESSAGE =
  "Trop de tentatives. Réessaie dans quelques minutes.";
