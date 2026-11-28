import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/server/auth/roles";

export type AdminUserRow = {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  role: AppRole;
  roles: AppRole[];
};

const ROLE_PRIORITY: AppRole[] = [
  "super_admin",
  "admin",
  "moderator",
  "finance_admin",
  "support_admin",
  "kyc_admin",
  "catalog_admin",
  "associate",
  "seller",
  "buyer",
];

export async function getAdminUserDirectory(perPage = 200): Promise<AdminUserRow[]> {
  const admin = createSupabaseAdminClient();

  const [{ data: usersData, error: usersError }, { data: roleRows, error: rolesError }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage }),
    admin.from("user_roles").select("user_id, role"),
  ]);

  if (usersError || rolesError) {
    console.error("[admin-user-directory] unable to load user directory", {
      usersError: usersError?.message,
      rolesError: rolesError?.message,
    });
    throw new Error("Impossible de charger l’annuaire des utilisateurs.");
  }

  const rolesById = new Map<string, AppRole[]>();
  for (const row of roleRows ?? []) {
    const existing = rolesById.get(row.user_id) ?? [];
    existing.push(row.role);
    rolesById.set(row.user_id, existing);
  }

  function primaryRole(userId: string): AppRole {
    const roles = rolesById.get(userId) ?? [];
    for (const candidate of ROLE_PRIORITY) {
      if (roles.includes(candidate)) return candidate;
    }
    return "buyer";
  }

  return (usersData?.users ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    created_at: user.created_at,
    role: primaryRole(user.id),
    roles: rolesById.get(user.id) ?? [],
  }));
}
