import { requireAdmin, getCurrentUserRoles, getCurrentUserPermissions, getPrimaryRole } from "@/server/auth/roles";
import { ADMIN_NAV } from "@/content/admin/nav";

// Données admin réelles, propres à chaque requête authentifiée — ne
// doivent jamais être figées au moment du build ni mises en cache
// statiquement (afficherait un état obsolète ou, pire, les données
// d'un autre utilisateur).
export const dynamic = "force-dynamic";
import AdminSidebar from "./AdminSidebar";

/**
 * Garde d'accès unique pour tout l'espace admin : requireAdmin() est
 * vérifié ici, au niveau du layout, donc chaque page sous /admin/* en
 * hérite automatiquement — plus besoin de le répéter dans chaque page
 * (contrairement à /admin/arriere-plans avant cette refonte, où
 * chaque page l'appelait individuellement).
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const roles = await getCurrentUserRoles();
  const [role, permissions] = await Promise.all([
    Promise.resolve(getPrimaryRole(roles)),
    getCurrentUserPermissions(roles),
  ]);
  const navItems = ADMIN_NAV.filter((item) =>
    (!item.superAdminOnly || roles.includes("super_admin")) &&
    item.permissions.every((permission) => permissions.includes(permission))
  );

  return (
    <div className="min-h-screen bg-brand-bg md:flex">
      <AdminSidebar adminEmail={user.email ?? "—"} adminRole={role} navItems={navItems} />
      <div className="flex-1 min-w-0">
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
