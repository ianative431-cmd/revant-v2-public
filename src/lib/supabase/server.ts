/**
 * Client Supabase utilisable UNIQUEMENT côté serveur (Server Components,
 * Route Handlers, Server Actions). Utilise la clé publique + les cookies
 * de session de l'utilisateur courant — respecte donc les règles RLS
 * définies en base pour CET utilisateur, jamais un accès admin.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  // Prefer server-only runtime variables; fall back to existing public names
  // for compatibility with current deployments.
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Configuration Supabase serveur manquante : vérifier SUPABASE_URL et SUPABASE_ANON_KEY dans l'environnement du service."
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Appelé depuis un Server Component : ignorable si un middleware
          // gère déjà le rafraîchissement de session (voir middleware.ts).
        }
      },
    },
  });
}
