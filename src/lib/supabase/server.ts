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

  // Utiliser les mêmes variables publiques que le navigateur en priorité :
  // une ancienne SUPABASE_ANON_KEY peut être obsolète ou pointer ailleurs.
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Configuration Supabase serveur manquante : vérifier NEXT_PUBLIC_SUPABASE_URL et la clé publique Supabase dans l'environnement du service."
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
