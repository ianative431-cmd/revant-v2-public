import type { Metadata } from "next";
import { requireAdmin, getCurrentUserRole } from "@/server/auth/roles";
import AdminPwaRegister from "@/components/pwa/AdminPwaRegister";

// Données admin réelles, propres à chaque requête authentifiée — ne
// doivent jamais être figées au moment du build ni mises en cache
// statiquement (afficherait un état obsolète ou, pire, les données
// d'un autre utilisateur).
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Revant — Super Admin",
  applicationName: "Revant Super Admin",
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Revant Admin", statusBarStyle: "black-translucent" },
  icons: { icon: "/images/logo-super-admin-512.png", apple: "/images/logo-super-admin-512.png" },
};
import AdminSidebar from "./AdminSidebar";

/**
 * Garde d'accès unique pour tout l'espace admin : requireAdmin() est
 * vérifié ici, au niveau du layout, donc chaque page sous /admin/* en
 * hérite automatiquement — plus besoin de le répéter dans chaque page
 * (contrairement à /admin/arriere-plans avant cette refonte, où
 * chaque page l'appelait individuellement).
 */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin();
  const role = await getCurrentUserRole();

  return (
    <div className="min-h-screen bg-brand-bg md:flex">
      <AdminPwaRegister />
      <AdminSidebar adminEmail={user.email ?? "—"} adminRole={role} />
      <div className="flex-1 min-w-0">
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
