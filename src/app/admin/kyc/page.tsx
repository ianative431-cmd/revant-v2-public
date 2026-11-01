import Link from "next/link";
import { requirePermission } from "@/server/auth/roles";
import { getAdminKycQueue } from "@/server/admin/kyc";
import KycDocumentButton from "./KycDocumentButton";
import { updateKycStatusAction } from "@/server/admin/kyc-actions";

export const dynamic = "force-dynamic";

type Filter = "pending" | "approved" | "rejected" | "expired" | "all";
const FILTERS: Filter[] = ["pending", "approved", "rejected", "expired", "all"];
const LABEL: Record<string, string> = {
  pending: "À examiner",
  approved: "Approuvés",
  rejected: "Refusés",
  expired: "Expirés",
  all: "Tous les dossiers",
};
const STATUS_LABEL: Record<string, string> = {
  not_started: "Non commencé",
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
  expired: "Expiré",
};
const ERROR_LABEL: Record<string, string> = {
  invalid: "La demande est invalide.",
  reason: "Le motif de refus doit contenir entre 5 et 500 caractères.",
  document: "Impossible d'approuver : le document privé n'est pas associé ou introuvable.",
  reviewed: "Ce dossier a déjà été traité. Recharge la liste.",
  save: "La mise à jour a échoué. Réessaie ou consulte les journaux.",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminKycPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  await requirePermission("kyc.manage");
  const [{ status: requestedStatus, error }, records] = await Promise.all([searchParams, getAdminKycQueue()]);
  const filter: Filter = FILTERS.includes(requestedStatus as Filter) ? (requestedStatus as Filter) : "pending";
  const counts = {
    pending: records.filter((item) => item.status === "pending").length,
    approved: records.filter((item) => item.status === "approved").length,
    rejected: records.filter((item) => item.status === "rejected").length,
    expired: records.filter((item) => item.status === "expired").length,
    all: records.length,
  };
  const visible = filter === "all" ? records : records.filter((item) => item.status === filter);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#803e2f]">Conformité & sécurité</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Vérification des identités</h1>
          <p className="mt-2 max-w-2xl text-sm text-black/60">
            Examine les justificatifs privés des vendeurs et enregistre chaque décision dans le journal d'administration.
          </p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-[#803e2f] underline">Retour au tableau de bord</Link>
      </header>

      {error && ERROR_LABEL[error] && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{ERROR_LABEL[error]}</p>
      )}
      {requestedStatus === "approved" && (
        <p role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Le dossier a été approuvé.</p>
      )}
      {requestedStatus === "rejected" && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Le dossier a été refusé et le motif a été enregistré.</p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["pending", "approved", "rejected", "expired"] as const).map((key) => (
          <div key={key} className="rounded-2xl border border-black/5 bg-white p-4">
            <p className="text-xs text-black/50">{LABEL[key]}</p>
            <p className="mt-2 text-2xl font-black tabular-nums">{counts[key]}</p>
          </div>
        ))}
      </section>

      <nav aria-label="Filtrer les dossiers KYC" className="flex flex-wrap gap-2">
        {FILTERS.map((key) => (
          <Link
            key={key}
            href={"/admin/kyc?status=" + key}
            aria-current={filter === key ? "page" : undefined}
            className={"rounded-full px-4 py-2 text-xs font-semibold " + (filter === key ? "bg-[#1f1d20] text-white" : "border border-black/10 bg-white text-black/60 hover:bg-black/5")}
          >
            {LABEL[key]} <span className="ml-1 opacity-70">({counts[key]})</span>
          </Link>
        ))}
      </nav>

      <section className="space-y-3">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#803e2f]/10 text-xl text-[#803e2f]">✓</div>
            <h2 className="mt-4 text-base font-bold">
              {filter === "pending" ? "Aucun dossier à examiner" : "Aucun dossier dans cette catégorie"}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-black/50">
              Les demandes KYC réelles apparaîtront ici dès qu'un utilisateur aura soumis son dossier. Aucun dossier fictif n'est affiché.
            </p>
          </div>
        ) : (
          visible.map((item) => (
            <article key={item.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold">{item.legalName ?? "Identité non renseignée"}</h2>
                    <span className={"rounded-full px-2.5 py-1 text-[11px] font-bold " + (item.status === "approved" ? "bg-green-100 text-green-800" : item.status === "rejected" ? "bg-red-100 text-red-800" : item.status === "expired" ? "bg-black/5 text-black/60" : "bg-amber-100 text-amber-900")}>
                      {STATUS_LABEL[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-1 break-all text-sm text-black/60">{item.email ?? "E-mail non renseigné"}</p>
                  <p className="mt-1 text-xs text-black/50">
                    {item.phone ? "+" + item.phone : "Téléphone non renseigné"} · {item.city ?? "Ville non renseignée"} · {item.countryCode}
                  </p>
                </div>
                <div className="text-right text-xs text-black/45">
                  <p>Soumis le {formatDate(item.submittedAt ?? item.createdAt)}</p>
                  {item.reviewedAt && <p className="mt-1">Traité le {formatDate(item.reviewedAt)}</p>}
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-xl bg-[#f7f6f4] p-3 text-sm sm:grid-cols-3">
                <div><p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Type de pièce</p><p className="mt-1 font-medium">{item.documentType ?? "Non renseigné"}</p></div>
                <div><p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Pays du document</p><p className="mt-1 font-medium">{item.documentCountry ?? "Non renseigné"}</p></div>
                <div><p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Derniers chiffres</p><p className="mt-1 font-medium">{item.documentLast4 ? "•••• " + item.documentLast4 : "—"}</p></div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  {item.documentPath ? (
                    <KycDocumentButton kycId={item.id} />
                  ) : (
                    <p className="text-xs text-amber-800">Justificatif non associé à ce dossier.</p>
                  )}
                </div>
                {item.status === "pending" && (
                  <div className="flex flex-wrap items-end gap-3">
                    <form action={updateKycStatusAction}>
                      <input type="hidden" name="kycId" value={item.id} />
                      <input type="hidden" name="action" value="approve" />
                      <button type="submit" className="rounded-full bg-[#803e2f] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#6e352a]">
                        Approuver
                      </button>
                    </form>
                    <form action={updateKycStatusAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="kycId" value={item.id} />
                      <input type="hidden" name="action" value="reject" />
                      <label className="min-w-48 flex-1 text-[11px] font-semibold text-black/60">
                        Motif obligatoire
                        <input name="reason" required minLength={5} maxLength={500} placeholder="Ex. document illisible" className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs font-normal" />
                      </label>
                      <button type="submit" className="rounded-full border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-50">
                        Refuser
                      </button>
                    </form>
                  </div>
                )}
              </div>
              {item.status === "rejected" && item.rejectionReason && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">Motif enregistré : {item.rejectionReason}</p>
              )}
            </article>
          ))
        )}
      </section>
      <p className="text-xs text-black/40">Les documents sont conservés dans un bucket privé. L'accès est généré à la demande pour 60 secondes et réservé aux rôles disposant de la permission KYC.</p>
    </div>
  );
}
