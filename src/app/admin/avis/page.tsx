import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import { moderateReviewAction, updateReportAction } from "@/server/admin/review-actions";

export const dynamic = "force-dynamic";

const REPORT_STATUS: Record<string, string> = {
  open: "Ouvert",
  reviewing: "En cours",
  resolved: "Résolu",
  dismissed: "Classé sans suite",
};

export default async function AdminAvisPage() {
  await requirePermission("support.manage");
  const admin = createSupabaseAdminClient();
  const [{ data: reviews, error: reviewsError }, { data: reports, error: reportsError }] = await Promise.all([
    admin.from("reviews").select("id, user_id, product_id, shop_id, order_id, rating, title, body, is_published, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("reports").select("id, reporter_id, target_type, target_id, reason, description, status, assigned_to, resolution_note, created_at, updated_at").order("created_at", { ascending: false }).limit(100),
  ]);
  if (reviewsError || reportsError) throw new Error("Impossible de charger les avis et signalements.");

  const publishedCount = (reviews ?? []).filter((item) => item.is_published).length;
  const openCount = (reports ?? []).filter((item) => item.status === "open" || item.status === "reviewing").length;

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-xl font-bold">Avis et signalements</h1>
        <p className="mt-1 text-sm text-black/55">Modération des avis et traitement des signalements, avec contrôle serveur et journalisation des décisions.</p>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">Avis reçus</p><p className="mt-1 text-2xl font-bold">{reviews?.length ?? 0}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">Avis publiés</p><p className="mt-1 text-2xl font-bold">{publishedCount}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">Signalements</p><p className="mt-1 text-2xl font-bold">{reports?.length ?? 0}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">À traiter</p><p className="mt-1 text-2xl font-bold">{openCount}</p></div>
      </div>
      <section className="space-y-3">
        <div><h2 className="text-base font-bold">Avis clients</h2><p className="text-xs text-black/50">Les avis sont associés à un produit et à une commande livrée par la règle RLS existante.</p></div>
        {(reviews ?? []).length === 0 ? <p className="rounded-2xl border border-dashed border-black/15 bg-white p-6 text-center text-sm text-black/45">Aucun avis réel pour le moment.</p> : (reviews ?? []).map((review) => (
          <article key={review.id} className="rounded-2xl border border-black/5 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{review.title ?? "Avis sans titre"} <span className="ml-2 text-amber-600">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></p>
                <p className="mt-1 text-xs text-black/45">Client {review.user_id.slice(0, 8)} · Produit {review.product_id?.slice(0, 8) ?? "—"} · Boutique {review.shop_id?.slice(0, 8) ?? "—"} · Commande {review.order_id?.slice(0, 8) ?? "—"}</p>
                {review.body && <p className="mt-3 whitespace-pre-wrap text-sm text-black/75">{review.body}</p>}
                <p className="mt-2 text-xs text-black/40">{new Date(review.created_at).toLocaleString("fr-FR")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={review.is_published ? "rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-800" : "rounded-full bg-black/5 px-2.5 py-1 text-xs text-black/60"}>{review.is_published ? "Publié" : "Masqué"}</span>
                <form action={moderateReviewAction}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <input type="hidden" name="publish" value={review.is_published ? "false" : "true"} />
                  <button className="rounded-full border border-black/15 px-3 py-2 text-xs font-semibold">{review.is_published ? "Masquer" : "Publier"}</button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </section>
      <section className="space-y-3">
        <div><h2 className="text-base font-bold">Signalements</h2><p className="text-xs text-black/50">Les décisions passent par la fonction admin_update_report, qui enregistre les actions et le journal d&apos;audit.</p></div>
        {(reports ?? []).length === 0 ? <p className="rounded-2xl border border-dashed border-black/15 bg-white p-6 text-center text-sm text-black/45">Aucun signalement réel pour le moment.</p> : (reports ?? []).map((report) => (
          <article key={report.id} className="rounded-2xl border border-black/5 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{report.reason}</h3><span className="rounded-full bg-black/5 px-2.5 py-1 text-xs">{REPORT_STATUS[report.status] ?? report.status}</span></div>
                <p className="mt-1 text-xs text-black/45">Cible : {report.target_type} {report.target_id.slice(0, 8)} · Signalé par {report.reporter_id.slice(0, 8)} · {new Date(report.created_at).toLocaleString("fr-FR")}</p>
                {report.description && <p className="mt-3 whitespace-pre-wrap text-sm text-black/75">{report.description}</p>}
                {report.resolution_note && <p className="mt-2 rounded-lg bg-black/5 p-2 text-xs">Note : {report.resolution_note}</p>}
              </div>
              {report.status === "open" && <form action={updateReportAction}><input type="hidden" name="reportId" value={report.id} /><input type="hidden" name="action" value="review" /><button className="rounded-full bg-black px-3 py-2 text-xs font-semibold text-white">Prendre en charge</button></form>}
            </div>
            {report.status === "reviewing" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <form action={updateReportAction} className="space-y-2"><input type="hidden" name="reportId" value={report.id} /><input type="hidden" name="action" value="resolve" /><textarea name="note" required minLength={5} maxLength={500} placeholder="Décision et motif (obligatoire)" className="w-full rounded-xl border border-black/10 p-3 text-xs" /><button className="rounded-full bg-[#803e2f] px-3 py-2 text-xs font-semibold text-white">Résoudre</button></form>
                <form action={updateReportAction} className="space-y-2"><input type="hidden" name="reportId" value={report.id} /><input type="hidden" name="action" value="dismiss" /><textarea name="note" required minLength={5} maxLength={500} placeholder="Motif du classement (obligatoire)" className="w-full rounded-xl border border-black/10 p-3 text-xs" /><button className="rounded-full border border-black/15 px-3 py-2 text-xs font-semibold">Classer sans suite</button></form>
              </div>
            )}
          </article>
        ))}
      </section>
    </section>
  );
}
