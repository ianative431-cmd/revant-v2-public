import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import { updateReportStatus } from "@/server/admin/report-actions";

const STATUS_LABEL: Record<string, string> = {
  open: "Ouvert",
  reviewing: "En cours d’examen",
  resolved: "Résolu",
  dismissed: "Classé sans suite",
};

const TYPE_LABEL: Record<string, string> = {
  user: "Compte vendeur",
  shop: "Boutique",
  product: "Produit",
  review: "Avis",
  message: "Message",
  order: "Commande",
};

export default async function AdminReportsPage() {
  await requirePermission("products.manage");
  const admin = createSupabaseAdminClient() as unknown as SupabaseClient;
  const { data, error } = await admin
    .from("reports")
    .select("id,reporter_id,target_type,target_id,reason,description,status,assigned_to,resolution_note,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const reports = data ?? [];
  const productIds = reports.filter((report) => report.target_type === "product").map((report) => report.target_id);
  const shopIds = reports.filter((report) => report.target_type === "shop").map((report) => report.target_id);
  const sellerIds = reports.filter((report) => report.target_type === "user").map((report) => report.target_id);

  const [productRows, shopRows, sellerRows] = await Promise.all([
    productIds.length ? admin.from("products").select("id,name").in("id", productIds) : Promise.resolve({ data: [] }),
    shopIds.length ? admin.from("shops").select("id,name,slug").in("id", shopIds) : Promise.resolve({ data: [] }),
    sellerIds.length ? admin.from("shops").select("owner_id,name,slug").in("owner_id", sellerIds) : Promise.resolve({ data: [] }),
  ]);

  const productLabels = new Map((productRows.data ?? []).map((item) => [item.id, item.name]));
  const shopLabels = new Map((shopRows.data ?? []).map((item) => [item.id, { name: item.name, slug: item.slug }]));
  const sellerLabels = new Map((sellerRows.data ?? []).map((item) => [item.owner_id, { name: item.name, slug: item.slug }]));

  return (
    <main className="min-h-screen bg-[#F7F5F0] px-4 py-8 text-[#20252B]">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm underline text-[#687650]">← Tableau de bord</Link>
        <header className="my-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#687650]">Modération Revant</p>
          <h1 className="mt-2 text-2xl font-bold">Signalements</h1>
          <p className="mt-1 text-sm text-black/60">Examine les signalements envoyés par les utilisateurs.</p>
        </header>

        {error ? (
          <p className="rounded-xl bg-white p-4 text-sm text-red-700">Impossible de charger les signalements.</p>
        ) : reports.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-sm text-black/60">Aucun signalement pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const shop = report.target_type === "shop" ? shopLabels.get(report.target_id) : null;
              const seller = report.target_type === "user" ? sellerLabels.get(report.target_id) : null;
              const targetName = report.target_type === "product"
                ? productLabels.get(report.target_id)
                : shop?.name ?? seller?.name;
              const targetHref = report.target_type === "product"
                ? `/produit/${report.target_id}`
                : shop?.slug || seller?.slug
                  ? `/shop/${shop?.slug ?? seller?.slug}`
                  : null;

              return (
                <article key={report.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-bold">{TYPE_LABEL[report.target_type] ?? report.target_type} · {report.reason}</h2>
                    <span className="rounded-full bg-black/5 px-3 py-1 text-xs">{STATUS_LABEL[report.status] ?? report.status}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{targetName ?? "Élément indisponible"}</p>
                  <p className="mt-1 break-all text-xs text-black/55">Référence : {report.target_id}</p>
                  {targetHref && <Link href={targetHref} className="mt-2 inline-block text-xs font-semibold text-[#687650] underline">Ouvrir l’élément signalé</Link>}
                  <p className="mt-1 break-all text-xs text-black/45">Signalé par : {report.reporter_id}</p>
                  {report.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{report.description}</p>}
                  <form action={updateReportStatus} className="mt-4 grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                    <input type="hidden" name="reportId" value={report.id} />
                    <label className="text-xs font-semibold">
                      Statut
                      <select name="status" defaultValue={report.status} className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm">
                        <option value="open">Ouvert</option>
                        <option value="reviewing">En cours d’examen</option>
                        <option value="resolved">Résolu</option>
                        <option value="dismissed">Classé sans suite</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold">
                      Note de résolution
                      <input name="resolutionNote" defaultValue={report.resolution_note ?? ""} maxLength={1000} className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" />
                    </label>
                    <button type="submit" className="rounded-full bg-[#F46A18] px-4 py-2.5 text-xs font-bold text-white">Enregistrer</button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
