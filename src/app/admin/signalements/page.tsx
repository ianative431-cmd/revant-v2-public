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
  user: "Compte",
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
            {reports.map((report) => (
              <article key={report.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold">{TYPE_LABEL[report.target_type] ?? report.target_type} · {report.reason}</h2>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs">{STATUS_LABEL[report.status] ?? report.status}</span>
                </div>
                <p className="mt-2 break-all text-xs text-black/55">Élément : {report.target_id}</p>
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
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
