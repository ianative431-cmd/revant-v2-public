import { getAdminReviewAndReportData } from "@/server/admin/operations";
import ReportActions from "./ReportActions";

export default async function AdminReviewsReportsPage() {
  const { reviews, reports } = await getAdminReviewAndReportData();
  return <div className="space-y-6">
    <header><h1 className="text-xl font-bold">Avis et signalements</h1><p className="mt-1 text-sm text-black/55">Avis associés à une commande et signalements réels. Les actions de traitement sont journalisées côté base.</p></header>
    <section className="rounded-2xl bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Signalements</h2><span className="text-xs text-black/45">{reports.length} affiché(s), maximum 100</span></div>
      {reports.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucun signalement enregistré.</p> : <div className="mt-3 space-y-3">{reports.map((report) => <article key={report.id} className="rounded-xl border border-black/5 p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{report.reason} · {report.target_type}</p><span className="rounded-full bg-black/5 px-2.5 py-1 text-xs">{report.status}</span></div><p className="mt-2 text-sm text-black/70">{report.description || "Aucune description fournie."}</p><p className="mt-1 text-xs text-black/40">Cible · {report.target_id.slice(0, 8)} · {new Date(report.created_at).toLocaleString("fr-FR")}</p>{report.resolution_note && <p className="mt-2 rounded-lg bg-black/[0.03] p-2 text-xs text-black/60">Traitement : {report.resolution_note}</p>}<ReportActions reportId={report.id} status={report.status} /></article>)}</div>}
    </section>
    <section className="rounded-2xl bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Avis acheteurs</h2><span className="text-xs text-black/45">{reviews.length} affiché(s), maximum 100</span></div>
      {reviews.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucun avis publié ou enregistré pour le moment.</p> : <div className="mt-3 space-y-3">{reviews.map((review) => <article key={review.id} className="rounded-xl border border-black/5 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{review.title || "Avis sans titre"}</p><span className="text-sm font-semibold">{review.rating}/5</span></div><p className="mt-2 text-sm text-black/70">{review.body || "—"}</p><div className="mt-2 flex flex-wrap gap-3 text-xs text-black/45"><span>{review.is_published ? "Publié" : "Non publié"}</span><span>Commande · {review.order_id?.slice(0, 8) ?? "—"}</span><span>{new Date(review.created_at).toLocaleDateString("fr-FR")}</span></div></article>)}</div>}
    </section>
    <p className="text-xs text-black/45">La publication ou le retrait d’un avis n’est pas encore relié à une action d’administration dédiée ; seuls les signalements disposent ici d’un traitement sécurisé et audité.</p>
  </div>;
}
