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
export async function getAdminUserDirectory(perPage = 200): Promise<AdminUserRow[]> {
  const admin = createSupabaseAdminClient();

  const [{ data: usersData }, { data: profilesData }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage }),
    admin.from("profiles").select("id, role"),
  ]);

  const roleById = new Map<string, AppRole>();
  for (const p of profilesData ?? []) {
    roleById.set(p.id, (p.role as AppRole) ?? "customer");
  }

  return (usersData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? null,
    phone: u.phone ?? null,
    created_at: u.created_at,
    role: roleById.get(u.id) ?? "customer",
  }));
}
