import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";

export type AppRole = "admin" | "seller" | "customer";

export async function getCurrentUserRole(): Promise<AppRole> {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return (data?.role as AppRole) ?? "customer";
}

/**
 * Garde-fou serveur pour toute page ou Server Action réservée à
 * l'administration. La vérification interroge la base à chaque appel —
 * jamais un état mis en cache côté client. Redirige silencieusement
 * vers l'accueil plutôt que d'afficher un espace admin partiellement
 * chargé à quelqu'un qui n'y a pas droit.
 */
export async function requireAdmin() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (data?.role !== "admin") {
    redirect("/");
  }

  return user;
}
