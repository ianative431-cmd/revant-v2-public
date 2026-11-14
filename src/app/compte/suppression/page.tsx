import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getCurrentUserRoles, type AppRole } from "@/server/auth/roles";
import { cancelAccountDeletion, requestAccountDeletion } from "./actions";

const ADMIN_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "moderator",
  "finance_admin",
  "support_admin",
  "kyc_admin",
  "catalog_admin",
  "associate",
];

const BLOCKER_LABELS: Record<string, string> = {
  shop_transfer_or_closure: "Ta boutique doit d’abord être transférée ou clôturée.",
  financial_or_order_obligations: "Des commandes ou obligations financières doivent être traitées.",
  legal_or_identity_records: "Des dossiers d’identité ou obligations légales doivent être examinés.",
  communication_or_moderation_history: "Des éléments de communication ou de modération doivent être conservés ou traités.",
  related_records_need_review: "Des données liées à ton compte nécessitent une vérification.",
  storage_cleanup_required: "Des fichiers liés à ton compte doivent être traités de façon sécurisée.",
};

type DeletionRequest = {
  request_id: string;
  request_status: string;
  blockers: string[] | null;
  created_at: string;
  updated_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  requested: "Demande reçue",
  blocked: "Étapes préalables nécessaires",
  approved: "Demande en cours de traitement",
  rejected: "Demande refusée",
  cancelled: "Demande annulée",
  completed: "Suppression terminée",
};

export default async function AccountDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUserWithLegalConsent();
  const { status: notice } = await searchParams;
  const roles = await getCurrentUserRoles();
  const isAdmin = ADMIN_ROLES.some((role) => roles.includes(role));
  const enabled = process.env.ACCOUNT_DELETION_REQUESTS_ENABLED === "true";

  let request: DeletionRequest | null = null;
  let loadError = false;

  if (enabled && !isAdmin) {
    const supabase = await createSupabaseServerClient();
    const db = supabase as unknown as SupabaseClient;
    const { data, error } = await db.rpc("get_my_account_deletion_request");
    if (error) {
      loadError = true;
    } else {
      const result = (Array.isArray(data) ? data[0] : data) as DeletionRequest | null;
      request = result ?? null;
    }
  }

  const active = request?.request_status === "requested" || request?.request_status === "blocked";
  const blockers = (request?.blockers ?? []).map((code) => BLOCKER_LABELS[code] ?? "Une vérification supplémentaire est nécessaire.");

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 text-brand-text">
      <div className="mx-auto max-w-xl">
        <Link href="/compte" className="text-sm text-brand-muted underline">← Mon compte</Link>
        <header className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Confidentialité et données</p>
          <h1 className="mt-2 text-2xl font-bold">Suppression du compte</h1>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Tu peux demander la suppression de ton compte Revant. La demande est vérifiée avant toute suppression afin de protéger les commandes, les paiements et les obligations légales.
          </p>
        </header>

        {notice === "unavailable" && <p role="status" className="mt-5 rounded-xl bg-white p-4 text-sm text-brand-muted">Ce parcours n’est pas encore activé. Aucune donnée n’a été modifiée.</p>}
        {notice === "confirmation" && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">Écris exactement « SUPPRIMER MON COMPTE » pour confirmer ta demande.</p>}
        {notice === "error" && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">La demande n’a pas pu être enregistrée. Réessaie plus tard.</p>}
        {notice === "cancelled" && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Ta demande a été annulée. Ton compte reste actif.</p>}
        {notice === "requested" && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Ta demande a été enregistrée. Ton compte n’est pas encore supprimé.</p>}
        {notice === "blocked" && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Ta demande est enregistrée, mais certaines étapes doivent être réglées avant la suppression.</p>}
        {notice === "admin" && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">Les comptes disposant d’un rôle administratif ne peuvent pas utiliser la suppression client.</p>}

        {!enabled ? (
          <section className="mt-6 rounded-2xl border border-brand-border bg-white p-5">
            <h2 className="font-semibold">Activation en préparation</h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">Le parcours sera ouvert après validation de la migration sécurisée et des contrôles de conservation des données. Tu peux revenir à ton compte sans risque.</p>
          </section>
        ) : isAdmin ? (
          <section className="mt-6 rounded-2xl border border-brand-border bg-white p-5">
            <h2 className="font-semibold">Compte administratif protégé</h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">La suppression autonome est réservée aux comptes clients. Cette protection ne modifie pas la connexion ni la récupération Super Admin.</p>
          </section>
        ) : loadError ? (
          <p role="alert" className="mt-6 rounded-xl bg-white p-4 text-sm text-red-700">Impossible de charger l’état de ta demande.</p>
        ) : request ? (
          <section className="mt-6 rounded-2xl border border-brand-border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{STATUS_LABELS[request.request_status] ?? "Demande enregistrée"}</h2>
              <span className="rounded-full bg-brand-bg px-3 py-1 text-xs text-brand-muted">{request.request_status}</span>
            </div>
            <p className="mt-2 text-xs text-brand-muted">Demande du {new Date(request.created_at).toLocaleDateString("fr-FR")}</p>
            {blockers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold">Avant de pouvoir supprimer le compte</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-brand-muted">
                  {blockers.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )}
            {request.request_status === "requested" && <p className="mt-4 text-sm leading-6 text-brand-muted">La demande est enregistrée. Elle doit encore être examinée. Aucun accès ni historique n’a été supprimé.</p>}
            {request.request_status === "blocked" && <p className="mt-4 text-sm leading-6 text-brand-muted">La demande reste ouverte. Les données financières et les historiques protégés ne seront pas effacés pour contourner ces étapes.</p>}
            {active && <form action={cancelAccountDeletion} className="mt-5"><button type="submit" className="rounded-full border border-brand-border px-4 py-2 text-sm font-semibold">Annuler ma demande</button></form>}
            {request.request_status === "approved" && <p className="mt-4 text-sm leading-6 text-brand-muted">Ta demande est en cours d’examen par l’équipe habilitée. Aucune suppression automatique n’est déclenchée.</p>}
            {!active && (request.request_status === "cancelled" || request.request_status === "rejected") && (
              <div className="mt-5 border-t border-brand-border pt-4">
                <p className="text-sm text-brand-muted">Tu peux envoyer une nouvelle demande si ta situation a changé.</p>
                <form action={requestAccountDeletion} className="mt-4 space-y-3">
                  <label htmlFor="confirmation" className="block text-sm font-medium">Pour confirmer, écris : SUPPRIMER MON COMPTE</label>
                  <input id="confirmation" name="confirmation" type="text" required autoComplete="off" pattern="SUPPRIMER MON COMPTE" className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-accent)]" placeholder="SUPPRIMER MON COMPTE" />
                  <button type="submit" className="w-full rounded-full bg-[var(--brand-accent)] px-5 py-3 text-sm font-bold text-white">Envoyer une nouvelle demande</button>
                </form>
              </div>
            )}
          </section>
        ) : (
          <section className="mt-6 rounded-2xl border border-brand-border bg-white p-5">
            <h2 className="font-semibold">Confirmer la demande</h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">Cette étape enregistre une demande, pas une suppression immédiate. Revant vérifiera d’abord les boutiques, commandes, paiements, remboursements, portefeuilles, dossiers KYC et fichiers associés.</p>
            <form action={requestAccountDeletion} className="mt-5 space-y-4">
              <label htmlFor="confirmation" className="block text-sm font-medium">Pour confirmer, écris : SUPPRIMER MON COMPTE</label>
              <input id="confirmation" name="confirmation" type="text" required autoComplete="off" pattern="SUPPRIMER MON COMPTE" className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-accent)]" placeholder="SUPPRIMER MON COMPTE" />
              <button type="submit" className="w-full rounded-full bg-[var(--brand-accent)] px-5 py-3 text-sm font-bold text-white">Envoyer ma demande</button>
            </form>
          </section>
        )}

        <p className="mt-5 text-xs leading-5 text-brand-muted">
          La conservation éventuelle de certaines pièces financières, comptables ou de prévention de fraude dépend des obligations applicables. Les données conservées doivent être limitées à ce qui est nécessaire.
        </p>
      </div>
    </main>
  );
}
