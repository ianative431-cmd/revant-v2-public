import { getAdminSecurityEvents } from "@/server/admin/operations";

export default async function AdminSecurityPage() {
  const { auditLogs, adminActions } = await getAdminSecurityEvents();
  return <div className="space-y-6">
    <header><h1 className="text-xl font-bold">Sécurité et journaux d’audit</h1><p className="mt-1 text-sm text-black/55">Historique réel des événements et actions administrateur. Les empreintes IP et métadonnées internes ne sont pas exposées dans cette vue.</p></header>
    <section className="rounded-2xl bg-white p-4"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Événements d’audit</h2><span className="text-xs text-black/45">{auditLogs.length} / 100</span></div>
      {auditLogs.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucun événement d’audit enregistré.</p> : <div className="mt-3 space-y-2">{auditLogs.map((item) => <article key={item.id} className="flex flex-wrap items-start justify-between gap-2 border-t border-black/5 py-3"><div><p className="text-sm font-medium">{item.description || item.action}</p><p className="mt-1 text-xs text-black/45">{item.entity_type} · {item.entity_id?.slice(0, 8) ?? "—"} · {item.action}</p></div><time className="text-xs text-black/40">{new Date(item.created_at).toLocaleString("fr-FR")}</time></article>)}</div>}
    </section>
    <section className="rounded-2xl bg-white p-4"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Actions administrateur</h2><span className="text-xs text-black/45">{adminActions.length} / 100</span></div>
      {adminActions.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucune action administrateur enregistrée.</p> : <div className="mt-3 space-y-2">{adminActions.map((item) => <article key={item.id} className="border-t border-black/5 py-3"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-medium">{item.action} · {item.target_type}</p><time className="text-xs text-black/40">{new Date(item.created_at).toLocaleString("fr-FR")}</time></div><p className="mt-1 text-xs text-black/50">Cible · {item.target_id?.slice(0, 8) ?? "—"}{item.reason ? ` · ${item.reason}` : ""}</p></article>)}</div>}
    </section>
  </div>;
}
