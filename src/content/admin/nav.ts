export type AdminNavItem = {
  label: string;
  href: string;
  /** true = la page existe et utilise des données réelles (certaines actions peuvent rester en lecture seule). */
  ready: boolean;
  permissions: string[];
  superAdminOnly?: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Tableau de bord", href: "/admin", ready: true, permissions: ["users.view"] },
  { label: "Utilisateurs", href: "/admin/utilisateurs", ready: true, permissions: ["users.view"] },
  { label: "Vérification KYC", href: "/admin/kyc", ready: true, permissions: ["kyc.manage"] },
  { label: "Vendeurs", href: "/admin/vendeurs", ready: true, permissions: ["users.view", "shops.view"] },
  { label: "Boutiques", href: "/admin/boutiques", ready: true, permissions: ["shops.view"] },
  { label: "Produits", href: "/admin/produits", ready: true, permissions: ["products.view"] },
  { label: "Commandes", href: "/admin/commandes", ready: true, permissions: ["users.view"] },
  { label: "Livraisons", href: "/admin/livraisons", ready: true, permissions: ["support.manage"] },
  { label: "Paiements", href: "/admin/paiements", ready: true, permissions: ["finance.view"] },
  { label: "Finance", href: "/admin/finance", ready: true, permissions: ["finance.view"] },
  { label: "Retraits", href: "/admin/retraits", ready: true, permissions: ["finance.view"] },
  { label: "Promotions", href: "/admin/promotions", ready: true, permissions: ["catalog.manage"] },
  { label: "Parrainages", href: "/admin/parrainages", ready: true, permissions: ["users.view"] },
  { label: "Avis & signalements", href: "/admin/avis", ready: true, permissions: ["support.manage"] },
  { label: "Messages", href: "/admin/messages", ready: true, permissions: ["support.manage"] },
  { label: "WhatsApp", href: "/admin/whatsapp", ready: true, permissions: ["whatsapp.manage"], superAdminOnly: true },
  { label: "Liens Maison", href: "/admin/maison", ready: true, permissions: ["settings.manage"], superAdminOnly: true },
  { label: "Sécurité", href: "/admin/securite", ready: true, permissions: ["audit.view"] },
  { label: "Paramètres", href: "/admin/parametres", ready: true, permissions: ["settings.manage"] },
];

/**
 * Ce que nécessite chaque section pas encore construite, affiché
 * honnêtement à l'admin plutôt qu'une donnée simulée (section 12 du
 * prompt maître "mise à jour" : ne pas considérer une page comme prête
 * simplement parce qu'elle s'affiche).
 */
export const ADMIN_STUB_REQUIREMENTS: Record<string, string> = {};
