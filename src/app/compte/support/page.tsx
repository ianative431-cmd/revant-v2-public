import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string,string> = {
  open: "Ouvert",
  in_progress: "En cours",
  waiting_user: "En attente de réponse",
  resolved: "Résolu",
  closed: "Clôturé",
};

export default async function CompteSupportPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id,subject,status,priority,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) throw new Error("Impossible de charger tes demandes d’assistance.");

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/compte" className="text-sm text-brand-text/60 underline">← Mon compte</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-brand-text">Assistance Revant</h1>
            <p className="mt-1 text-sm text-brand-text/60">Tes demandes et les réponses de notre équipe.</p>
          </div>
          <Link href="/compte/support/nouveau" className="rounded-full bg-brand-accent px-4 py-2.5 text-sm font-bold text-white">Nouvelle demande</Link>
        </div>
        {!data?.length ? (
          <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-8 text-center">
            <p className="font-semibold text-brand-text">Aucune demande pour le moment.</p>
            <p className="mt-2 text-sm text-brand-text/60">Si tu rencontres un problème, ouvre un dossier pour contacter l’équipe Revant.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {data.map((ticket) => (
              <Link key={ticket.id} href={`/compte/support/${ticket.id}`} className="block rounded-2xl border border-brand-border bg-brand-surface p-4 transition hover:border-brand-accent">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-brand-text">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-brand-text/50">Dossier {ticket.id.slice(0,8).toUpperCase()} · {new Date(ticket.updated_at).toLocaleString("fr-FR")}</p>
                  </div>
                  <span className="rounded-full bg-brand-bg px-3 py-1 text-xs font-semibold text-brand-text/70">{STATUS_LABEL[ticket.status] ?? ticket.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
