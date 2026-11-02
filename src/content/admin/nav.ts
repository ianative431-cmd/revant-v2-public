export type AdminNavItem = {
  label: string;
  href: string;
  /** true = section réelle et consultable ; false = fonctionnalité métier non construite. */
  ready: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Tableau de bord", href: "/admin", ready: true },
  { label: "Utilisateurs", href: "/admin/utilisateurs", ready: true },
  { label: "Vérification KYC", href: "/admin/kyc", ready: true },
  { label: "Vendeurs", href: "/admin/vendeurs", ready: true },
  { label: "Boutiques", href: "/admin/boutiques", ready: true },
  { label: "Produits", href: "/admin/produits", ready: true },
  { label: "Commandes", href: "/admin/commandes", ready: true },
  { label: "Livraisons", href: "/admin/livraisons", ready: true },
  { label: "Paiements", href: "/admin/paiements", ready: true },
  { label: "Finance", href: "/admin/finance", ready: true },
  { label: "Retraits détaillés", href: "/admin/retraits", ready: true },
  { label: "Promotions boutique", href: "/admin/promotions", ready: true },
  { label: "Parrainages", href: "/admin/parrainages", ready: true },
  { label: "Avis & signalements", href: "/admin/avis", ready: false },
  { label: "Messages", href: "/admin/messages", ready: true },
  { label: "WhatsApp", href: "/admin/whatsapp", ready: true },
  { label: "Liens Maison", href: "/admin/maison", ready: true },
  { label: "Sécurité & audit", href: "/admin/securite", ready: true },
  { label: "Paramètres", href: "/admin/parametres", ready: true },
  { label: "Abonnements boutiques", href: "/admin/abonnements", ready: true },
];

export const ADMIN_STUB_REQUIREMENTS: Record<string, string> = {
  "/admin/avis": "un système d'avis vérifiés relié aux commandes réellement livrées, avec anti-doublon et modération",
};
