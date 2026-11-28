import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePermission, hasPermission } from "@/server/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SupportTicketControls from "./SupportTicketControls";
import SupportStaffReplyForm from "./SupportStaffReplyForm";

const STATUS_LABEL: Record<string,string> = {
  open: "Ouvert",
  in_progress: "En cours",
  waiting_user: "En attente client",
  resolved: "Résolu",
  closed: "Clôturé",
};
const EVENT_LABEL: Record<string,string> = {
  created: "Demande créée",
  status_changed: "Statut modifié",
  priority_changed: "Priorité modifiée",
  assigned: "Dossier attribué",
  unassigned: "Dossier désattribué",
  message_sent: "Message envoyé",
};

export default async function AdminSupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("support.manage");
  const canManageAll = await hasPermission("users.manage");
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id,user_id,subject,description,status,priority,assigned_to,created_at,updated_at,resolved_at")
    .eq("id", id)
    .maybeSingle();

  if (ticketError || !ticket) notFound();
  if (!canManageAll && ticket.assigned_to && ticket.assigned_to !== user.id) redirect("/admin/support");

  const [{ data: messages, error: messagesError }, { data: events, error: eventsError }] = await Promise.all([
    supabase.from("support_messages").select("id,sender_id,body,created_at").eq("ticket_id", id).order("created_at", { ascending: true }).limit(100),
    supabase.from("support_ticket_events").select("id,actor_id,event_type,metadata,created_at").eq("ticket_id", id).order("created_at", { ascending: true }).limit(100),
  ]);

  if (messagesError || eventsError) throw new Error("Impossible de charger l’historique complet du dossier.");

  return (
    <div>
      <Link href="/admin/support" className="text-sm text-brand-text/55 underline">← Centre de support</Link>
      <header className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-text/45">Dossier {ticket.id.slice(0,8).toUpperCase()}</p>
            <h1 className="mt-2 text-xl font-black text-brand-text">{ticket.subject}</h1>
            <p className="mt-1 text-xs text-brand-text/50">Client {ticket.user_id} · Créé le {new Date(ticket.created_at).toLocaleString("fr-FR")}</p>
          </div>
          <span className="rounded-full bg-brand-bg px-3 py-1.5 text-xs font-bold text-brand-text/70">{STATUS_LABEL[ticket.status] ?? ticket.status}</span>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-brand-text/80">{ticket.description}</p>
      </header>

      <div className="mt-5">
        <SupportTicketControls
          ticketId={ticket.id}
          status={ticket.status}
          priority={ticket.priority}
          assignedTo={ticket.assigned_to}
          currentUserId={user.id}
        />
      </div>

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-bold text-brand-text">Historique des échanges</h2>
        {!messages?.length ? <p className="rounded-xl bg-brand-surface p-4 text-sm text-brand-text/55">Aucun message.</p> : messages.map((message) => (
          <article key={message.id} className={`rounded-2xl border p-4 ${message.sender_id === ticket.user_id ? "border-brand-border bg-brand-surface" : "border-brand-accent/25 bg-brand-accent/5"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-brand-text">{message.sender_id === ticket.user_id ? "Client" : "Équipe Revant"}</p>
              <time className="text-[11px] text-brand-text/45">{new Date(message.created_at).toLocaleString("fr-FR")}</time>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-brand-text/80">{message.body}</p>
          </article>
        ))}
      </section>

      {ticket.status !== "closed" && <div className="mt-6"><SupportStaffReplyForm ticketId={ticket.id} /></div>}

      <section className="mt-7 rounded-2xl border border-brand-border bg-brand-surface p-4">
        <h2 className="text-sm font-bold text-brand-text">Journal des interventions</h2>
        {!events?.length ? <p className="mt-3 text-xs text-brand-text/50">Aucun événement enregistré.</p> : (
          <ol className="mt-3 space-y-3">
            {events.map((event) => (
              <li key={event.id} className="border-l-2 border-brand-accent/30 pl-3">
                <p className="text-xs font-semibold text-brand-text">{EVENT_LABEL[event.event_type] ?? event.event_type}</p>
                <p className="mt-1 text-[11px] text-brand-text/45">{new Date(event.created_at).toLocaleString("fr-FR")} · {event.actor_id ? event.actor_id.slice(0,8) : "Système"}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
