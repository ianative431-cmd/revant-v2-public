import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Client Supabase "service role" — CONTOURNE les règles RLS.
 *
 * Règles strictes :
 * - Ne jamais importer ce fichier dans un composant "use client" ou dans
 *   tout code exécuté côté navigateur (le `import "server-only"` ci-dessus
 *   fait échouer le build si c'est le cas par erreur).
 * - Réservé aux opérations serveur qui dépassent explicitement les droits
 *   RLS de l'utilisateur courant (modération, audit et vues admin).
 * - Chaque opération doit vérifier une permission serveur avant d'utiliser
 *   ce client. Ne jamais l'importer depuis un composant client.
 * - La clé SUPABASE_SERVICE_ROLE_KEY ne doit jamais être préfixée par
 *   NEXT_PUBLIC_, sous peine d'être exposée au navigateur.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
