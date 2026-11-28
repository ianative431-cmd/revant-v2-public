import Link from "next/link";
import { requirePermission, hasPermission } from "@/server/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string,string> = {
  open: "Ouvert",
  in_progress: "En cours",
  waiting_user: "En attente client",
  resolved: "Résolu",
  closed: "Clôturé",
};

const VALID_STATUSES = new Set(["open","in_progress","waiting_user","resolved","closed"]);

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requirePermission("support.manage");
  const canManageAll = await hasPermission("users.manage");
  const { status } = await searchParams;
  const selectedStatus = status && VALID_STATUSES.has(status) ? status : null;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("support_tickets")
    .select("id,user_id,subject,status,priority,assigned_to,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (selectedStatus) query = query.eq("status", selectedStatus);
  if (!canManageAll) query = query.or(`assigned_to.is.null,assigned_to.eq.${user.id}`);

  const { data, error } = await query;
  if (error) throw new Error("Impossible de charger la file d’assistance.");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-text">Centre de support</h1>
          <p className="mt-1 text-sm text-brand-text/55">Dossiers clients, réponses et suivi des interventions.</p>
        </div>
        <p className="text-xs text-brand-text/45">{data?.length ?? 0} dossier(s) affiché(s) · limite 100</p>
      </div>
      <nav aria-label="Filtrer les dossiers" className="mt-5 flex flex-wrap gap-2">
        <Link href="/admin/support" className={`rounded-full px-3 py-2 text-xs font-semibold ${!selectedStatus ? "bg-brand-accent text-white" : "border border-brand-border text-brand-text/65"}`}>Tous</Link>
        {Object.entries(STATUS_LABEL).map(([value,label]) => (
          <Link key={value} href={`/admin/support?status=${value}`} className={`rounded-full px-3 py-2 text-xs font-semibold ${selectedStatus===value ? "bg-brand-accent text-white" : "border border-brand-border text-brand-text/65"}`}>{label}</Link>
        ))}
      </nav>
      {!data?.length ? (
        <p className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-8 text-center text-sm text-brand-text/55">Aucun dossier dans cette file.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {data.map((ticket) => (
            <Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="block rounded-2xl border border-brand-border bg-brand-surface p-4 transition hover:border-brand-accent">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-brand-text">{ticket.subject}</p>
                  <p className="mt-1 text-xs text-brand-text/45">Dossier {ticket.id.slice(0,8).toUpperCase()} · Client {ticket.user_id.slice(0,8)} · {new Date(ticket.updated_at).toLocaleString("fr-FR")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-bg px-3 py-1 text-xs font-semibold text-brand-text/70">{STATUS_LABEL[ticket.status] ?? ticket.status}</span>
                  <span className="rounded-full border border-brand-border px-3 py-1 text-xs text-brand-text/60">Priorité {ticket.priority}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-brand-text/50">{ticket.assigned_to ? `Attribué à ${ticket.assigned_to.slice(0,8)}` : "Non attribué"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
