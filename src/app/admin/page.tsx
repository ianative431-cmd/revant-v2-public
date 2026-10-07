import { getAdminOverviewStats } from "@/server/admin/stats";

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <p className="text-xs text-black/50 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value.toLocaleString("fr-FR")}</p>
      {sub && <p className="text-[11px] text-black/40 mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getAdminOverviewStats();

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Tableau de bord</h1>
      <p className="text-sm text-black/60 mb-6">
        Chiffres réels, à l&apos;instant — aucune donnée simulée.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Utilisateurs"
          value={stats.users}
          sub={`${stats.suspendedUsers} suspendu${stats.suspendedUsers > 1 ? "s" : ""}`}
        />
        <StatCard
          label="Boutiques"
          value={stats.shops}
          sub={`${stats.activeShops} active${stats.activeShops > 1 ? "s" : ""}`}
        />
        <StatCard
          label="Produits"
          value={stats.products}
          sub={`${stats.pendingProducts} en attente`}
        />
        <StatCard
          label="Commandes"
          value={stats.orders}
          sub={`${stats.pendingOrders} en cours`}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Litiges ouverts" value={stats.openDisputes} />
        <StatCard label="KYC en attente" value={stats.pendingKyc} />
        <StatCard label="Tickets support ouverts" value={stats.openSupport} />
      </div>

      <div className="bg-white rounded-2xl p-4">
        <h2 className="text-sm font-semibold mb-3">Commandes récentes</h2>
        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-black/50">Aucune commande pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-black/50">
                <tr>
                  <th className="py-1 pr-3 font-medium">N°</th>
                  <th className="py-1 pr-3 font-medium">Statut</th>
                  <th className="py-1 pr-3 font-medium">Montant</th>
                  <th className="py-1 font-medium">Créée le</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-black/5">
                    <td className="py-2 pr-3">{order.orderNumber}</td>
                    <td className="py-2 pr-3">{order.status}</td>
                    <td className="py-2 pr-3">
                      {order.totalAmount} {order.currency}
                    </td>
                    <td className="py-2">
                      {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
