import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/server/auth/roles";

export const dynamic = "force-dynamic";

type DeletionRequest = {
  id: string;
  user_id: string | null;
  status: string;
  blockers: string[] | null;
  created_at: string;
  updated_at: string;
};

const BLOCKER_LABELS: Record<string, string> = {
  shop_transfer_or_closure: "Boutique à transférer ou clôturer",
  financial_or_order_obligations: "Commandes ou obligations financières",
  legal_or_identity_records: "Dossiers légaux ou d’identité",
  communication_or_moderation_history: "Historique de communication ou modération",
  related_records_need_review: "Autres données liées à examiner",
  storage_cleanup_required: "Fichiers Storage à traiter",
};

export default async function AdminDeletionRequestsPage() {
  await requireSuperAdmin();

  if (process.env.ACCOUNT_DELETION_REQUESTS_ENABLED !== "true") {
    return (
      <section className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-xl font-bold">Demandes de suppression</h1>
        <p className="rounded-xl bg-white p-5 text-sm text-black/60">La file sera disponible après validation et application contrôlée de la migration des demandes de suppression. Aucune donnée n’a été modifiée.</p>
      </section>
    );
  }

  const supabase = createSupabaseAdminClient();
  const db = supabase as unknown as SupabaseClient;
  const { data, error } = await db
    .from("account_deletion_requests")
    .select("id,user_id,status,blockers,created_at,updated_at")
    .in("status", ["requested", "blocked", "approved"])
    .order("created_at", { ascending: true })
    .limit(100);

  const requests = (data ?? []) as DeletionRequest[];

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-black/45">Super Admin · Confidentialité</p>
        <h1 className="mt-1 text-xl font-bold">Demandes de suppression</h1>
        <p className="mt-1 text-sm text-black/60">File de revue en lecture seule. Aucun compte, fichier ou historique financier ne peut être supprimé depuis cet écran.</p>
      </header>
      {error ? (
        <p role="alert" className="rounded-xl bg-white p-5 text-sm text-red-700">Impossible de charger les demandes. Vérifie que la migration a été appliquée avant d’activer le parcours.</p>
      ) : requests.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-black/60">Aucune demande ouverte.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Demande {request.id.slice(0, 8)}…</h2>
                  <p className="mt-1 text-xs text-black/50">Compte : {request.user_id ? `${request.user_id.slice(0, 8)}…` : "Identité déjà détachée"}</p>
                </div>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium">{request.status}</span>
              </div>
              <p className="mt-2 text-xs text-black/50">Reçue le {new Date(request.created_at).toLocaleString("fr-FR")}</p>
              {(request.blockers ?? []).length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-black/65">
                  {(request.blockers ?? []).map((code) => <li key={code}>{BLOCKER_LABELS[code] ?? "Vérification complémentaire requise"}</li>)}
                </ul>
              )}
              {request.status === "requested" && <p className="mt-3 text-xs text-black/55">Pré-vérification sans blocage détecté. La suppression finale nécessite encore une revue distincte.</p>}
            </article>
          ))}
        </div>
      )}
      <p className="text-xs leading-5 text-black/45">Les décisions, la réauthentification, le transfert de boutique, la conservation légale et l’exécution de suppression seront ajoutés dans une étape séparée avec journal d’audit. Cette page n’effectue aucune action destructive.</p>
    </section>
  );
}
