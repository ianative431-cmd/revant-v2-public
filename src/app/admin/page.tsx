import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminOverviewStats } from "@/server/admin/stats";
import { getCurrentUserRole, requirePermission } from "@/server/auth/roles";

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[#485330]/15 border-l-4 border-l-[#687650] bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs font-medium text-[#485330]/75">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-[#171013]">{value.toLocaleString("fr-FR")}</p>
      {sub && <p className="mt-1 text-[11px] text-[#485330]/65">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const role = await getCurrentUserRole();
  if (role === "associate") {
    await requirePermission("shops.view");
    await requirePermission("products.view");
    const admin = createSupabaseAdminClient();
    const [{ count: shops }, { count: products }] = await Promise.all([
      admin.from("shops").select("id", { count: "exact", head: true }),
      admin.from("products").select("id", { count: "exact", head: true }),
    ]);
    return (
      <div>
        <h1 className="text-xl font-bold mb-1">Espace associé</h1>
        <p className="text-sm text-black/60 mb-6">Accès limité à la consultation des boutiques et du catalogue. Les données financières, commandes nominatives, paiements, retraits et KYC ne sont pas accessibles.</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Boutiques" value={shops ?? 0} />
          <StatCard label="Produits" value={products ?? 0} />
        </div>
      </div>
    );
  }

  await requirePermission("users.view");
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

      <div className="rounded-2xl border border-[#485330]/15 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-[#203426]">Commandes récentes</h2>
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
