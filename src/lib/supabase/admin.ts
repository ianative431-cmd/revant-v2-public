import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Client Supabase "service role" — CONTOURNE les règles RLS.
 *
 * Règles strictes :
 * - Ne jamais importer ce fichier dans un composant "use client" ou dans
 *   du code exécuté côté navigateur. `import "server-only"` bloque
 *   cette erreur au build.
 * - Chaque usage doit être exceptionnel, côté serveur, après une autorisation
 *   explicite vérifiée côté serveur. Le rôle service_role contourne RLS :
 *   il ne remplace jamais requirePermission ni les contrôles de propriété.
 * - Le registre receipt_documents est utilisé uniquement par :
 *   (1) l'écran Super Admin protégé par finance.view, avec une sélection
 *       limitée aux métadonnées non sensibles ;
 *   (2) le vérificateur public, avec une recherche exacte par empreinte
 *       SHA-256 et une réponse limitée aux champs publics du document.
 * - Ne jamais retourner de snapshot complet, de données personnelles ou de
 *   secret depuis le vérificateur public.
 * - La clé SUPABASE_SERVICE_ROLE_KEY reste strictement serveur et ne doit
 *   jamais être préfixée par NEXT_PUBLIC_.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
