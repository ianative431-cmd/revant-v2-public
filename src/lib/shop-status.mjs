const STATUS_LABELS = {
  draft: "Brouillon",
  pending: "En attente de validation",
  active: "Active",
  suspended: "Suspendue",
  closed: "Fermée",
};

/**
 * @param {string} status
 * @returns {string}
 */
export function getShopStatusLabel(status) {
  return STATUS_LABELS[status] || "Statut inconnu";
}

/**
 * Une boutique en brouillon doit d'abord être soumise par son propriétaire.
 * @param {string} status
 * @returns {{nextStatus: "active" | "suspended", label: string, kind: "activate" | "suspend"} | null}
 */
export function getShopStatusAction(status) {
  if (status === "active") {
    return { nextStatus: "suspended", label: "Suspendre", kind: "suspend" };
  }
  if (status === "suspended") {
    return { nextStatus: "active", label: "Réactiver", kind: "activate" };
  }
  if (status === "pending") {
    return { nextStatus: "active", label: "Approuver", kind: "activate" };
  }
  return null;
}

/**
 * Vérifie les transitions autorisées côté serveur.
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {boolean}
 */
export function canTransitionShopStatus(currentStatus, nextStatus) {
  if (currentStatus === "active") return nextStatus === "suspended";
  if (currentStatus === "pending" || currentStatus === "suspended") {
    return nextStatus === "active";
  }
  return false;
}
