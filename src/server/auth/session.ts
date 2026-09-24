import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Retourne l'utilisateur Supabase actuellement connecté, ou null.
 * Ne fait AUCUNE hypothèse de rôle : à ce stade (Étape 2), il n'existe
 * qu'une notion de compte authentifié, pas encore de rôle acheteur/
 * vendeur/admin (voir Étape 3).
 */
export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user;
  } catch {
    // Ne jamais laisser remonter une erreur réseau/config brute au
    // client (voir SECURITY.md, règle "erreurs serveur") — un problème
    // de connexion à Supabase est traité comme "non connecté".
    return null;
  }
}

/**
 * À utiliser en haut de toute page/route qui exige un compte connecté.
 * Redirige vers /connexion si personne n'est authentifié. Ceci est une
 * vérification CÔTÉ SERVEUR — jamais contournable en modifiant l'URL ou
 * en désactivant du JavaScript côté client.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }
  return user;
}
