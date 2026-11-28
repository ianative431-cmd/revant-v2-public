import type { Metadata } from "next";
import { requireAdmin, getCurrentUserRole, getCurrentUserPermissions } from "@/server/auth/roles";
import AdminPwaRegister from "@/components/pwa/AdminPwaRegister";
import AdminSidebar from "./AdminSidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Revant — Super Admin",
  applicationName: "Revant Super Admin",
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Revant Admin", statusBarStyle: "black-translucent" },
  icons: { icon: "/images/logo-super-admin-512.png", apple: "/images/logo-super-admin-512.png" },
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin();
  const [role, permissions] = await Promise.all([
    getCurrentUserRole(),
    getCurrentUserPermissions(),
  ]);

  return (
    <div className="revant-admin-shell min-h-screen bg-brand-bg md:flex">
      <AdminPwaRegister />
      <AdminSidebar
        adminEmail={user.email ?? "—"}
        adminRole={role}
        adminPermissions={permissions}
      />
      <div className="flex-1 min-w-0">
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
