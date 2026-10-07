import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminOverviewStats = {
  users: number;
  suspendedUsers: number;
  shops: number;
  activeShops: number;
  products: number;
  pendingProducts: number;
  orders: number;
  pendingOrders: number;
  openDisputes: number;
  pendingKyc: number;
  openSupport: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
  }>;
};

type SnapshotShape = {
  users: number;
  suspended_users: number;
  shops: number;
  active_shops: number;
  products: number;
  pending_products: number;
  orders: number;
  pending_orders: number;
  open_disputes: number;
  pending_kyc: number;
  open_support: number;
  recent_orders: Array<{
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    currency: string;
    created_at: string;
  }>;
};

/**
 * Compteurs réels pour le tableau de bord admin. Ne recalcule rien
 * côté frontend : délègue entièrement au RPC admin_overview_snapshot,
 * qui vérifie lui-même côté serveur que l'appelant a un rôle admin
 * (SECURITY DEFINER + vérification interne) et agrège les vraies
 * tables (utilisateurs, boutiques, produits, commandes, litiges, KYC,
 * support). Aucune donnée simulée — si l'appel échoue, l'erreur
 * remonte plutôt que d'afficher un chiffre inventé.
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("admin_overview_snapshot");

  if (error) {
    throw new Error(`Impossible de charger les statistiques admin : ${error.message}`);
  }

  const snapshot = data as unknown as SnapshotShape;

  return {
    users: snapshot.users,
    suspendedUsers: snapshot.suspended_users,
    shops: snapshot.shops,
    activeShops: snapshot.active_shops,
    products: snapshot.products,
    pendingProducts: snapshot.pending_products,
    orders: snapshot.orders,
    pendingOrders: snapshot.pending_orders,
    openDisputes: snapshot.open_disputes,
    pendingKyc: snapshot.pending_kyc,
    openSupport: snapshot.open_support,
    recentOrders: (snapshot.recent_orders ?? []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      totalAmount: o.total_amount,
      currency: o.currency,
      createdAt: o.created_at,
    })),
  };
}
