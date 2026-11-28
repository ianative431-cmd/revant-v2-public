import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getCurrentUser } from "@/server/auth/session";
import type { Enums } from "@/types/database";
import { hasAal2, hasVerifiedTotp, isTrustedSuperAdminDevice } from "@/server/auth/super-admin";

export type AppRole = Enums<"user_role">;

const ADMIN_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "moderator",
  "finance_admin",
  "support_admin",
  "kyc_admin",
  "catalog_admin",
  "associate",
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
    throw new Error("Impossible de charger les rôles : " + error.message);
  }

  return (data ?? []).map((r) => r.role);
}

/**
 * Rôle principal pour les éléments d'interface qui affichent un seul rôle.
 * Les contrôles d'accès doivent utiliser les permissions cumulées, pas
 * uniquement ce rôle principal.
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
 * Retourne l'union des permissions attribuées à tous les rôles réels
 * de l'utilisateur. Les données viennent exclusivement de la matrice
 * role_permissions en base, jamais des métadonnées client.
 */
export async function getCurrentUserPermissions(): Promise<string[]> {
  const roles = await getCurrentUserRoles();
  if (roles.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const { data: assignments, error: assignmentsError } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .in("role", roles);

  if (assignmentsError) {
    throw new Error("Impossible de vérifier les permissions administrateur.");
  }

  const permissionIds = [...new Set((assignments ?? []).map((row) => row.permission_id))];
  if (permissionIds.length === 0) return [];

  const { data: permissions, error: permissionsError } = await supabase
    .from("permissions")
    .select("key")
    .in("id", permissionIds);

  if (permissionsError) {
    throw new Error("Impossible de vérifier les permissions administrateur.");
  }

  return [...new Set((permissions ?? []).map((permission) => permission.key))];
}

/**
 * Garde-fou serveur pour toute page ou Server Action réservée à
 * l'administration. Les rôles sont relus depuis la base à chaque requête.
 */
export async function requireAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/admin-connexion");

  const user = await requireUserWithLegalConsent();
  const roles = await getCurrentUserRoles();

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) redirect("/admin-connexion?reason=not-admin");
  if (roles.includes("super_admin")) {
    const supabase = await createSupabaseServerClient();
    if (!(await hasVerifiedTotp(supabase))) redirect("/admin-connexion/securite");
    if (!(await hasAal2(supabase))) redirect("/admin-connexion/mfa");
    if (!(await isTrustedSuperAdminDevice(user.id))) redirect("/admin-connexion/appareil-en-attente");
  }
  return user;
}

/**
 * Vérifie une permission métier issue de role_permissions.
 */
export async function hasPermission(permissionKey: string): Promise<boolean> {
  const permissions = await getCurrentUserPermissions();
  return permissions.includes(permissionKey);
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

  if (!roles.includes("super_admin")) redirect("/admin");
  const supabase = await createSupabaseServerClient();
  if (!(await hasVerifiedTotp(supabase))) redirect("/admin-connexion/securite");
  if (!(await hasAal2(supabase))) redirect("/admin-connexion/mfa");
  if (!(await isTrustedSuperAdminDevice(user.id))) redirect("/admin-connexion/appareil-en-attente");
  return user;
}
