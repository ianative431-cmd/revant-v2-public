import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SupportReplyForm from "./SupportReplyForm";

const STATUS_LABEL: Record<string,string> = {
  open: "Ouvert",
  in_progress: "En cours",
  waiting_user: "En attente de réponse",
  resolved: "Résolu",
  closed: "Clôturé",
};

export default async function CompteSupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUserWithLegalConsent();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id,user_id,subject,description,status,priority,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ticketError || !ticket) notFound();

  const { data: messages, error: messagesError } = await supabase
    .from("support_messages")
    .select("id,sender_id,body,created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (messagesError) throw new Error("Impossible de charger l’historique du dossier.");

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/compte/support" className="text-sm text-brand-text/60 underline">← Mes demandes</Link>
        <header className="mt-5 rounded-2xl border border-brand-border bg-brand-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-text/45">Dossier {ticket.id.slice(0,8).toUpperCase()}</p>
              <h1 className="mt-2 text-xl font-black text-brand-text">{ticket.subject}</h1>
              <p className="mt-1 text-xs text-brand-text/50">Créé le {new Date(ticket.created_at).toLocaleString("fr-FR")}</p>
            </div>
            <span className="rounded-full bg-brand-bg px-3 py-1.5 text-xs font-bold text-brand-text/70">{STATUS_LABEL[ticket.status] ?? ticket.status}</span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-brand-text/80">{ticket.description}</p>
        </header>

        <section className="mt-5 space-y-3">
          <h2 className="text-sm font-bold text-brand-text">Historique des échanges</h2>
          {!messages?.length ? (
            <p className="rounded-xl bg-brand-surface p-4 text-sm text-brand-text/55">Aucune réponse pour le moment.</p>
          ) : messages.map((message) => (
            <article key={message.id} className={`rounded-2xl border p-4 ${message.sender_id === user.id ? "border-brand-accent/25 bg-brand-accent/5" : "border-brand-border bg-brand-surface"}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-brand-text">{message.sender_id === user.id ? "Toi" : "Équipe Revant"}</p>
                <time className="text-[11px] text-brand-text/45">{new Date(message.created_at).toLocaleString("fr-FR")}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-brand-text/80">{message.body}</p>
            </article>
          ))}
        </section>

        {ticket.status !== "closed" ? (
          <div className="mt-6"><SupportReplyForm ticketId={ticket.id} /></div>
        ) : (
          <p className="mt-6 rounded-xl bg-brand-surface p-4 text-sm text-brand-text/60">Ce dossier est clôturé. Ouvre une nouvelle demande si tu as besoin d’une autre assistance.</p>
        )}
      </div>
    </main>
  );
}
