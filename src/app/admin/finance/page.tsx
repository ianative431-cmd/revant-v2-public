import { getAdminFinanceSnapshot, getCommissionPercent } from "@/server/admin/finance";
import { getAllShopsForAdmin } from "@/server/admin/shops-admin";
import FinanceDashboard from "./FinanceDashboard";

/**
 * Page serveur : ne fait que charger les vraies données (aucune donnée
 * simulée) et les transmettre au tableau de bord client, qui gère les
 * filtres (période, recherche) et les graphiques. Les sections avec
 * actions réelles (commission, retraits) restent des Server Actions
 * classiques, rendues par FinanceDashboard.
 */
export default async function AdminFinancePage() {
  const [snapshot, commissionPercent, shops] = await Promise.all([
    getAdminFinanceSnapshot(),
    getCommissionPercent(),
    getAllShopsForAdmin(),
  ]);

  return (
    <FinanceDashboard
      summary={snapshot.summary}
      rule={snapshot.rule}
      providers={snapshot.providers}
      payments={snapshot.payments}
      payouts={snapshot.payouts}
      commissionPercent={commissionPercent}
      shops={shops.map((s) => ({ status: s.status, createdAt: s.created_at }))}
    />
  );
}
