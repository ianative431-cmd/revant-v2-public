/**
 * Client Supabase utilisable UNIQUEMENT côté serveur (Server Components,
 * Route Handlers, Server Actions). Utilise la clé publique + les cookies
 * de session de l'utilisateur courant — respecte donc les règles RLS
 * définies en base pour CET utilisateur, jamais un accès admin.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );
}
