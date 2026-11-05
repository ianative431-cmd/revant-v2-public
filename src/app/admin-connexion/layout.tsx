import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Revant — Connexion Super Admin",
  description: "Accès privé à l’administration de Revant.",
  applicationName: "Revant Super Admin",
  manifest: "/admin/manifest.webmanifest",
  icons: {
    icon: [{ url: "/images/logo-super-admin-512.png?v=20261105", type: "image/png", sizes: "512x512" }],
    shortcut: ["/images/logo-super-admin-512.png?v=20261105"],
    apple: [{ url: "/images/logo-super-admin-512.png?v=20261105", sizes: "512x512", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "Revant Admin", statusBarStyle: "black-translucent" },
};

export default function AdminConnexionLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
