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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Boutiques"
          value={stats.shops.total}
          sub={`${stats.shops.suspended} suspendue${stats.shops.suspended > 1 ? "s" : ""}`}
        />
        <StatCard
          label="Produits"
          value={stats.products.total}
          sub={`${stats.products.active} actif${stats.products.active > 1 ? "s" : ""}`}
        />
        <StatCard
          label="Utilisateurs"
          value={stats.users.total}
          sub={`${stats.users.seller} vendeur${stats.users.seller > 1 ? "s" : ""}`}
        />
        <StatCard
          label="Arrière-plans"
          value={stats.backgrounds.total}
          sub={`${stats.backgrounds.active} actif${stats.backgrounds.active > 1 ? "s" : ""}`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4">
          <h2 className="text-sm font-semibold mb-3">Boutiques par type</h2>
          <dl className="text-sm space-y-2">
            {[
              ["Standard", stats.shops.standard],
              ["Restaurant", stats.shops.restaurant],
              ["Pro", stats.shops.pro],
              ["Fournisseur", stats.shops.fournisseur],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <dt className="text-black/60">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <h2 className="text-sm font-semibold mb-3">Utilisateurs par rôle</h2>
          <dl className="text-sm space-y-2">
            {[
              ["Admin", stats.users.admin],
              ["Vendeur", stats.users.seller],
              ["Client", stats.users.customer],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <dt className="text-black/60">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
