export type AdminNavItem = {
  label: string;
  href: string;
  ready: boolean;
  requiredPermissions?: string[];
  superAdminOnly?: boolean;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Vue générale",
    items: [
      { label: "Vue d’ensemble", href: "/admin", ready: true, requiredPermissions: ["users.view"] },
      { label: "Analytique globale", href: "/admin/analytics", ready: true, requiredPermissions: ["users.view"] },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { label: "Utilisateurs", href: "/admin/utilisateurs", ready: true, requiredPermissions: ["users.view"] },
      { label: "Vendeurs", href: "/admin/vendeurs", ready: true, requiredPermissions: ["users.view", "shops.view"] },
      { label: "Boutiques", href: "/admin/boutiques", ready: true, requiredPermissions: ["shops.view"] },
      { label: "Produits", href: "/admin/produits", ready: true, requiredPermissions: ["products.view"] },
    ],
  },
  {
    label: "Opérations",
    items: [
      { label: "Commandes", href: "/admin/commandes", ready: true, requiredPermissions: ["support.manage"] },
      { label: "Livraisons", href: "/admin/livraisons", ready: true, requiredPermissions: ["support.manage"] },
      { label: "Centre de support", href: "/admin/support", ready: true, requiredPermissions: ["support.manage"] },
      { label: "Litiges", href: "/admin/litiges", ready: true, requiredPermissions: ["support.manage"] },
      { label: "Vérification KYC", href: "/admin/kyc", ready: true, requiredPermissions: ["kyc.manage"] },
      { label: "Avis & signalements", href: "/admin/avis", ready: true, requiredPermissions: ["support.manage"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Vue financière", href: "/admin/finance", ready: true, requiredPermissions: ["finance.view"] },
      { label: "Paiements", href: "/admin/paiements", ready: true, requiredPermissions: ["finance.view"] },
      { label: "Reçus & factures", href: "/admin/documents-financiers", ready: true, requiredPermissions: ["finance.view"] },
      { label: "Retraits", href: "/admin/retraits", ready: true, requiredPermissions: ["finance.view"] },
      { label: "Abonnements", href: "/admin/abonnements", ready: true, requiredPermissions: ["finance.view"] },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", href: "/admin/messages", ready: true, requiredPermissions: ["support.manage"] },
      { label: "WhatsApp Business", href: "/admin/whatsapp", ready: true, requiredPermissions: ["whatsapp.manage"] },
    ],
  },
  {
    label: "Croissance & sécurité",
    items: [
      { label: "Promotions", href: "/admin/promotions", ready: true, requiredPermissions: ["catalog.manage"] },
      { label: "Parrainages", href: "/admin/parrainages", ready: true, requiredPermissions: ["support.manage"] },
      { label: "Sécurité & appareils", href: "/admin/securite", ready: true, requiredPermissions: ["audit.view"] },
      { label: "Demandes de suppression", href: "/admin/demandes-suppression", ready: true, superAdminOnly: true },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "Centre de configuration", href: "/admin/parametres", ready: true, requiredPermissions: ["settings.manage"] },
    ],
  },
];

export const ADMIN_NAV: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
export const ADMIN_STUB_REQUIREMENTS: Record<string, string> = {};
