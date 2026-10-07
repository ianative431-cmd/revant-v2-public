import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/server/auth/roles";

export type AdminUserRow = {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  role: AppRole;
};

/**
 * Liste réelle des comptes (auth.users, accessible uniquement via le
 * client service role — jamais depuis un client normal) enrichie du
 * rôle applicatif (table profiles).
 *
 * Limite connue : une seule page de résultats (jusqu'à `perPage`
 * comptes). Suffisant pour la taille actuelle de Revant ; une vraie
 * pagination sera nécessaire avant une croissance importante — ne pas
 * la simuler avant d'en avoir besoin.
 */
const ROLE_PRIORITY: AppRole[] = [
  "super_admin",
  "admin",
  "moderator",
  "finance_admin",
  "support_admin",
  "kyc_admin",
  "catalog_admin",
  "seller",
  "buyer",
];

export async function getAdminUserDirectory(perPage = 200): Promise<AdminUserRow[]> {
  const admin = createSupabaseAdminClient();

  const [{ data: usersData }, { data: roleRows }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage }),
    admin.from("user_roles").select("user_id, role"),
  ]);

  const rolesById = new Map<string, AppRole[]>();
  for (const r of roleRows ?? []) {
    const existing = rolesById.get(r.user_id) ?? [];
    existing.push(r.role);
    rolesById.set(r.user_id, existing);
  }

  function primaryRole(userId: string): AppRole {
    const roles = rolesById.get(userId) ?? [];
    for (const candidate of ROLE_PRIORITY) {
      if (roles.includes(candidate)) return candidate;
    }
    return "buyer";
  }

  return (usersData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? null,
    phone: u.phone ?? null,
    created_at: u.created_at,
    role: primaryRole(u.id),
  }));
}
