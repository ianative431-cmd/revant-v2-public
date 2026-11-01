import { getAdminSupportInbox } from "@/server/admin/operations";

export default async function AdminSupportMessagesPage() {
  const { tickets, latestMessages } = await getAdminSupportInbox();
  return <div className="space-y-5">
    <header><h1 className="text-xl font-bold">Messages et support</h1><p className="mt-1 text-sm text-black/55">Boîte de réception des tickets d’assistance. Les conversations privées entre acheteurs et vendeurs ne sont pas ouvertes à cette vue générale.</p></header>
    <div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">Tickets affichés</p><p className="mt-1 text-2xl font-bold">{tickets.length}</p></div>
    <section className="rounded-2xl bg-white p-4"><h2 className="font-semibold">Tickets récents</h2>
      {tickets.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucun ticket support enregistré.</p> : <div className="mt-3 space-y-3">{tickets.map((ticket) => { const latest = latestMessages.get(ticket.id); return <article key={ticket.id} className="rounded-xl border border-black/5 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{ticket.subject}</p><p className="mt-1 text-xs text-black/45">Ticket · {ticket.id.slice(0, 8)} · {new Date(ticket.created_at).toLocaleString("fr-FR")}</p></div><div className="flex gap-2"><span className="rounded-full bg-black/5 px-2 py-1 text-xs">{ticket.status}</span><span className="rounded-full bg-black/5 px-2 py-1 text-xs">{ticket.priority}</span></div></div><p className="mt-3 whitespace-pre-wrap text-sm text-black/70">{ticket.description}</p>{latest && <div className="mt-3 rounded-lg bg-black/[0.03] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-black/40">Dernier message · {new Date(latest.created_at).toLocaleString("fr-FR")}</p><p className="mt-1 whitespace-pre-wrap text-sm text-black/70">{latest.body}</p></div>}</article>; })}</div>}
    </section>
    <p className="text-xs text-black/45">Cette page est actuellement en lecture seule. L’affectation, les réponses et le changement de priorité nécessitent encore un workflow serveur audité.</p>
  </div>;
}
