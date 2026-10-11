/**
 * Client Supabase utilisable côté navigateur et pendant le rendu serveur
 * des composants qui importent ce module. N'utilise jamais la clé service_role.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Configuration Supabase publique manquante : vérifier les variables Supabase du service Render, puis reconstruire le service."
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
