export type AdminNavItem = {
  label: string;
  href: string;
  /** true = section réelle et fonctionnelle ; false = page "Bientôt disponible" honnête (aucune donnée fictive). */
  ready: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Tableau de bord", href: "/admin", ready: true },
  { label: "Utilisateurs", href: "/admin/utilisateurs", ready: true },
  { label: "Vendeurs", href: "/admin/vendeurs", ready: true },
  { label: "Boutiques", href: "/admin/boutiques", ready: true },
  { label: "Produits", href: "/admin/produits", ready: true },
  { label: "Commandes", href: "/admin/commandes", ready: true },
  { label: "Livraisons", href: "/admin/livraisons", ready: false },
  { label: "Paiements", href: "/admin/paiements", ready: false },
  { label: "Finance", href: "/admin/finance", ready: true },
  { label: "Retraits", href: "/admin/retraits", ready: false },
  { label: "Promotions", href: "/admin/promotions", ready: false },
  { label: "Parrainages", href: "/admin/parrainages", ready: false },
  { label: "Avis & signalements", href: "/admin/avis", ready: false },
  { label: "Messages", href: "/admin/messages", ready: false },
  { label: "WhatsApp", href: "/admin/whatsapp", ready: false },
  { label: "Sécurité", href: "/admin/securite", ready: false },
  { label: "Paramètres", href: "/admin/parametres", ready: false },
];

/**
 * Ce que nécessite chaque section pas encore construite, affiché
 * honnêtement à l'admin plutôt qu'une donnée simulée (section 12 du
 * prompt maître "mise à jour" : ne pas considérer une page comme prête
 * simplement parce qu'elle s'affiche).
 */
export const ADMIN_STUB_REQUIREMENTS: Record<string, string> = {
  "/admin/livraisons": "un vrai suivi de livraison distinct (aujourd'hui, paiement et livraison sont confirmés ensemble en une seule étape par le vendeur)",
  "/admin/paiements": "une intégration de paiement réelle (Visa/Mastercard, mobile money)",
  "/admin/retraits": "une vue détaillée par portefeuille vendeur (l'approbation des retraits se fait déjà depuis Finance)",
  "/admin/promotions": "un système de codes promo/réductions relié aux commandes",
  "/admin/parrainages": "un programme de parrainage avec suivi des invitations",
  "/admin/avis": "un système d'avis (les commandes confirmées existent désormais, mais rien ne relie encore un avis à un achat réel)",
  "/admin/messages": "une messagerie interne entre acheteurs et vendeurs",
  "/admin/whatsapp": "une intégration WhatsApp Business API",
  "/admin/securite": "des journaux d'audit et de sécurité réels à afficher",
  "/admin/parametres": "des paramètres de plateforme réellement configurables",
};
