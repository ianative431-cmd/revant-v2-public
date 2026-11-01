import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getCurrentUser } from "@/server/auth/session";
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
 * l'administration. Les visiteurs non connectés sont dirigés vers
 * la connexion admin dédiée, puis le rôle est relu en base à chaque
 * requête. Le rôle ne vient jamais des métadonnées modifiables du client.
 */
export async function requireAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/admin-connexion");

  const user = await requireUserWithLegalConsent();
  const roles = await getCurrentUserRoles();

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    redirect("/");
  }

  return user;
}

/**
 * Vérifie une permission métier issue de role_permissions.
 * Les rôles sont relus depuis la base à chaque requête : aucune
 * permission ne provient des métadonnées modifiables du client.
 */
export async function hasPermission(permissionKey: string): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  if (roles.length === 0) return false;

  const supabase = await createSupabaseServerClient();
  const { data: assignments, error: assignmentsError } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .in("role", roles);

  if (assignmentsError) {
    throw new Error("Impossible de vérifier les permissions administrateur.");
  }

  const permissionIds = [...new Set((assignments ?? []).map((row) => row.permission_id))];
  if (permissionIds.length === 0) return false;

  const { data: permissions, error: permissionsError } = await supabase
    .from("permissions")
    .select("key")
    .in("id", permissionIds);

  if (permissionsError) {
    throw new Error("Impossible de vérifier les permissions administrateur.");
  }

  return Boolean(permissions?.some((permission) => permission.key === permissionKey));
}

export async function requirePermission(permissionKey: string) {
  const user = await requireAdmin();
  if (!(await hasPermission(permissionKey))) redirect("/admin");
  return user;
}

/**
 * Garde-fou réservé au super administrateur.
 */
export async function requireSuperAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/admin-connexion");

  const user = await requireUserWithLegalConsent();
  const roles = await getCurrentUserRoles();

  if (!roles.includes("super_admin")) {
    redirect("/admin");
  }

  return user;
}
