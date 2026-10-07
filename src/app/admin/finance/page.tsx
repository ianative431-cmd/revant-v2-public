import { getAdminFinanceSnapshot, getCommissionPercent } from "@/server/admin/finance";
import CommissionForm from "./CommissionForm";
import PayoutActions from "./PayoutActions";

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  authorized: "Autorisé",
  paid: "Payé",
  failed: "Échoué",
  cancelled: "Annulé",
  refunded: "Remboursé",
  partially_refunded: "Partiellement remboursé",
};

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  processing: "En traitement",
  paid: "Payé",
  failed: "Échoué",
  cancelled: "Annulé",
  rejected: "Rejeté",
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <p className="text-xs text-black/50 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-[11px] text-black/40 mt-1">{sub}</p>}
    </div>
  );
}

function money(amount: number, currency = "XOF") {
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

export default async function AdminFinancePage() {
  const [snapshot, commissionPercent] = await Promise.all([
    getAdminFinanceSnapshot(),
    getCommissionPercent(),
  ]);
  const { summary, rule, providers, payments, payouts } = snapshot;

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Finance</h1>
      <p className="text-sm text-black/60 mb-6">
        Chiffres réels, à l&apos;instant — aucune donnée simulée.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <StatCard
          label="Paiements réglés"
          value={String(summary.paidPayments)}
          sub={money(summary.paidVolume)}
        />
        <StatCard
          label="Retraits en attente"
          value={String(summary.pendingPayouts)}
          sub={money(summary.pendingPayoutAmount)}
        />
        <StatCard label="Commissions perçues" value={money(summary.commissionVolume)} />
        <StatCard label="Litiges ouverts" value={String(summary.openDisputes)} />
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4">
        <p className="text-sm font-medium mb-3">Commission Revant</p>
        <CommissionForm initialValue={commissionPercent} />
      </div>

      {rule && (
        <div className="bg-white rounded-2xl p-4 mb-4">
          <p className="text-sm font-medium mb-3">Règle de retrait (XOF)</p>
          <dl className="grid grid-cols-2 gap-y-2 text-xs">
            <dt className="text-black/50">Minimum</dt>
            <dd className="text-right">{money(rule.minAmount)}</dd>
            <dt className="text-black/50">Maximum</dt>
            <dd className="text-right">{rule.maxAmount ? money(rule.maxAmount) : "—"}</dd>
            <dt className="text-black/50">Plafond quotidien</dt>
            <dd className="text-right">{rule.dailyLimit ? money(rule.dailyLimit) : "—"}</dd>
            <dt className="text-black/50">Frais</dt>
            <dd className="text-right">
              {money(rule.feeAmount)} + {rule.feePercent}%
            </dd>
            <dt className="text-black/50">KYC requis</dt>
            <dd className="text-right">{rule.kycRequired ? "Oui" : "Non"}</dd>
            <dt className="text-black/50">Validation manuelle</dt>
            <dd className="text-right">{rule.manualApprovalRequired ? "Oui" : "Non"}</dd>
            <dt className="text-black/50">Règle active</dt>
            <dd className="text-right">{rule.enabled ? "Oui" : "Non"}</dd>
          </dl>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 mb-4">
        <p className="text-sm font-medium mb-3">Fournisseurs de paiement</p>
        {providers.length === 0 ? (
          <p className="text-xs text-black/40">Aucun fournisseur configuré.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {providers.map((p) => (
              <div key={p.code} className="flex items-center justify-between text-xs">
                <span>{p.name}</span>
                <span className={p.enabled ? "text-black font-medium" : "text-black/30"}>
                  {p.enabled ? "Actif" : "Inactif"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium mb-3">Paiements récents</p>
        {payments.length === 0 ? (
          <p className="text-xs text-black/40 bg-white rounded-2xl p-6 text-center">
            Aucun paiement pour l&apos;instant.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {payments.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.provider}</p>
                  <p className="text-[11px] text-black/40 mt-0.5">
                    {money(p.amount, p.currency)} · {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="text-[11px] shrink-0 rounded-full px-2 py-1 bg-black/5 text-black/60">
                  {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium mb-3">Retraits vendeurs</p>
        {payouts.length === 0 ? (
          <p className="text-xs text-black/40 bg-white rounded-2xl p-6 text-center">
            Aucun retrait pour l&apos;instant.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {payouts.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium">{money(p.amount, p.currency)}</p>
                  <p className="text-[11px] text-black/40 mt-0.5">
                    {new Date(p.requestedAt).toLocaleDateString("fr-FR")}
                    {p.failureReason ? ` · ${p.failureReason}` : ""}
                  </p>
                </div>
                {p.status === "pending" ? (
                  <PayoutActions payoutId={p.id} />
                ) : (
                  <span className="text-[11px] shrink-0 rounded-full px-2 py-1 bg-black/5 text-black/60">
                    {PAYOUT_STATUS_LABEL[p.status] ?? p.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
