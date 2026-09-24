import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase "service role" — CONTOURNE les règles RLS.
 *
 * Règles strictes :
 * - Ne jamais importer ce fichier dans un composant "use client" ou dans
 *   tout code exécuté côté navigateur (le `import "server-only"` ci-dessus
 *   fait échouer le build si c'est le cas par erreur).
 * - Réservé aux futures opérations admin qui doivent explicitement
 *   dépasser les droits de l'utilisateur courant (ex. modération,
 *   résolution de litige). Aucune de ces opérations n'est implémentée
 *   à ce stade (voir SECURITY.md et ARCHITECTURE.md).
 * - La clé SUPABASE_SERVICE_ROLE_KEY ne doit jamais être préfixée par
 *   NEXT_PUBLIC_, sous peine d'être exposée au navigateur.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
