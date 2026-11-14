import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminOverviewStats } from "@/server/admin/stats";
import { getAdminFinanceSnapshot } from "@/server/admin/finance";
import { getAllProductsForAdmin } from "@/server/admin/products-admin";
import { buildRecentRevenueSeries } from "@/server/admin/dashboard";
import { getCurrentUserRole, hasPermission, requirePermission } from "@/server/auth/roles";
import DashboardOverviewCharts from "./DashboardOverviewCharts";

function StatCard({ label, value, sub, href }: { label: string; value: number; sub: string; href: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-[#485330]/15 border-l-4 border-l-[#687650] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="mb-1 text-xs font-medium text-[#485330]/75">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-[#171013]">{value.toLocaleString("fr-FR")}</p>
      <p className="mt-1 text-[11px] text-[#485330]/65">{sub}</p>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const role = await getCurrentUserRole();
  if (role === "associate") {
    await requirePermission("shops.view");
    await requirePermission("products.view");
    const db = createSupabaseAdminClient();
    const [{ count: shops }, { count: products }] = await Promise.all([
      db.from("shops").select("id", { count: "exact", head: true }),
      db.from("products").select("id", { count: "exact", head: true }),
    ]);
    return (
      <div className="space-y-4">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#687650]">Revant · Équipe</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#171013]">Espace associé</h1>
          <p className="mt-1 text-sm text-black/50">Consultation limitée aux boutiques et au catalogue.</p>
        </header>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Boutiques" value={shops ?? 0} sub="Toutes les boutiques" href="/admin/boutiques" />
          <StatCard label="Produits" value={products ?? 0} sub="Catalogue Revant" href="/admin/produits" />
        </div>
      </div>
    );
  }

  await requirePermission("users.view");
  const canManageReports = await hasPermission("products.manage");
  const supabase = await createSupabaseServerClient();
  const [stats, finance, products, audit] = await Promise.all([
    getAdminOverviewStats(),
    getAdminFinanceSnapshot(),
    getAllProductsForAdmin(supabase, 5),
    createSupabaseAdminClient().from("audit_logs").select("id,action,description,entity_type,created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  const revenue = buildRecentRevenueSeries(finance.payments);
  const orders = stats.recentOrders.map((order) => ({
    id: order.id,
    number: order.orderNumber,
    status: order.status,
    amount: order.totalAmount,
    currency: order.currency,
    createdAt: order.createdAt,
  }));
  const productItems = products.map((product) => ({
    id: product.id,
    name: product.name,
    shop: product.shop?.name ?? "Boutique",
    price: product.base_price,
    currency: product.currency,
    status: product.status,
    image: product.images[0] ?? null,
  }));
  const activity = (audit.data ?? []).map((entry) => ({
    id: entry.id,
    action: entry.action,
    description: entry.description ?? "Action administrative",
    entity: entry.entity_type,
    createdAt: entry.created_at,
  }));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#687650]">Revant · Overview</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#171013]">Vue d’ensemble</h1>
          <p className="mt-1 text-sm text-black/50">Données réelles de la marketplace, actualisées à chaque chargement.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageReports && (
            <Link href="/admin/signalements" className="rounded-xl border border-[#485330]/20 px-4 py-2 text-xs font-semibold text-[#203426] hover:bg-[#687650]/10">
              Signalements
            </Link>
          )}
          <Link href="/admin/analytics" className="rounded-xl border border-[#485330]/20 px-4 py-2 text-xs font-semibold text-[#203426] hover:bg-[#687650]/10">
            Ouvrir l’analytique globale
          </Link>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Utilisateurs" value={stats.users} sub={`${stats.suspendedUsers} suspendu(s)`} href="/admin/utilisateurs" />
        <StatCard label="Boutiques" value={stats.shops} sub={`${stats.activeShops} active(s)`} href="/admin/boutiques" />
        <StatCard label="Produits" value={stats.products} sub={`${stats.pendingProducts} en attente`} href="/admin/produits" />
        <StatCard label="Commandes" value={stats.orders} sub={`${stats.pendingOrders} en cours`} href="/admin/commandes" />
      </div>
      <DashboardOverviewCharts
        revenue={revenue}
        products={productItems}
        orders={orders}
        activity={activity}
        tasks={{
          pendingOrders: stats.pendingOrders,
          openDisputes: stats.openDisputes,
          pendingKyc: stats.pendingKyc,
          openSupport: stats.openSupport,
        }}
      />
    </div>
  );
}
