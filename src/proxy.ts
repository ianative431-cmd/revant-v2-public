import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rafraîchit la session Supabase à chaque requête et propage les cookies
 * mis à jour. Ne prend AUCUNE décision de contrôle d'accès par rôle ici —
 * la vérification de rôle (acheteur/vendeur/admin) doit se faire dans
 * chaque route/page côté serveur (voir SECURITY.md), jamais uniquement ici.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Déclenche le rafraîchissement du token si nécessaire. Une erreur ici
  // (réseau, config Supabase) ne doit jamais faire planter la requête :
  // elle est traitée comme une session non rafraîchie, pas comme une
  // erreur serveur à afficher.
  try {
    await supabase.auth.getUser();
  } catch {
    // volontairement silencieux — voir SECURITY.md, règle "erreurs serveur"
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
