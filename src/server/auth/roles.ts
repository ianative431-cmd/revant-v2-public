import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import type { Enums } from "@/types/database";

export type AppRole = Enums<"user_role">;

const ADMIN_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "moderator",
  "finance_admin",
  "support_admin",
  "kyc_admin",
  "catalog_admin",
];

/**
 * Tous les rôles réels de l'utilisateur connecté (table user_roles —
 * un utilisateur peut cumuler plusieurs rôles). Jamais de donnée
 * simulée : interroge la vraie base à chaque appel.
 */
export async function getCurrentUserRoles(): Promise<AppRole[]> {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Impossible de charger les rôles : ${error.message}`);
  }

  return (data ?? []).map((r) => r.role);
}

/**
 * Rôle "principal" pour l'affichage simple (ex. annuaire utilisateurs).
 * Priorité : rôle admin le plus élevé, sinon vendeur, sinon acheteur.
 */
export async function getCurrentUserRole(): Promise<AppRole> {
  const roles = await getCurrentUserRoles();
  for (const role of ADMIN_ROLES) {
    if (roles.includes(role)) return role;
  }
  if (roles.includes("seller")) return "seller";
  return "buyer";
}

/**
 * Garde-fou serveur pour toute page ou Server Action réservée à
 * l'administration (tous rôles admin confondus). La vérification
 * interroge la base à chaque appel — jamais un état mis en cache côté
 * client. Redirige silencieusement vers l'accueil plutôt que
 * d'afficher un espace admin partiellement chargé à quelqu'un qui n'y
 * a pas droit.
 */
export async function requireAdmin() {
  const user = await requireUserWithLegalConsent();
  const roles = await getCurrentUserRoles();

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    redirect("/");
  }

  return user;
}

/**
 * Garde-fou réservé au super administrateur (ex. intégration Meta
 * WhatsApp Business : la connexion d'un compte professionnel entier
 * ne doit pas être accessible à un rôle admin plus restreint).
 * Redirige vers le tableau de bord admin plutôt que d'afficher la
 * page à quelqu'un qui n'a pas ce rôle précis.
 */
export async function requireSuperAdmin() {
  const user = await requireUserWithLegalConsent();
  const roles = await getCurrentUserRoles();

  if (!roles.includes("super_admin")) {
    redirect("/admin");
  }

  return user;
}
