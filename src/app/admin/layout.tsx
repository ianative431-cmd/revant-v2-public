import { requireAdmin } from "@/server/auth/roles";

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
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#F3E9DA] md:flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
