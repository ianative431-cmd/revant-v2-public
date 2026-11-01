import { hasPermission, requirePermission } from "@/server/auth/roles";
import { getAdminFinanceSnapshot } from "@/server/admin/finance";
import PayoutActions from "@/app/admin/finance/PayoutActions";

function money(amount: number, currency: string) {
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ${currency.trim()}`;
}

function maskReference(value: string | null) {
  if (!value) return "—";
  const compact = value.replace(/\s/g, "");
  return compact.length <= 4 ? "••••" : `•••• ${compact.slice(-4)}`;
}

export default async function AdminPayoutsPage() {
  await requirePermission("finance.view");
  const [snapshot, canManagePayouts] = await Promise.all([getAdminFinanceSnapshot(), hasPermission("payouts.manage")]);

  return <div className="space-y-6">
    <header><h1 className="text-xl font-bold">Retraits vendeurs</h1><p className="mt-1 text-sm text-black/55">Demandes de retrait et historique des versements. Les références de paiement sont masquées.</p></header>
    <section className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">Demandes en attente</p><p className="mt-1 text-2xl font-bold">{snapshot.summary.pendingPayouts.toLocaleString("fr-FR")}</p></div><div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">Montant en attente</p><p className="mt-1 text-2xl font-bold">{money(snapshot.summary.pendingPayoutAmount, "XOF")}</p></div></section>
    <section className="rounded-2xl bg-white p-4"><h2 className="font-semibold">Demandes et historique</h2>
      {snapshot.payouts.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucune demande de retrait enregistrée.</p> : <div className="mt-3 space-y-3">{snapshot.payouts.map((payout) => <article key={payout.id} className="rounded-xl border border-black/5 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{money(payout.amount, payout.currency)}</p><p className="mt-1 text-xs text-black/50">Vendeur · {payout.sellerId.slice(0, 8)} · {payout.destinationType ?? "Destination non précisée"} · {maskReference(payout.destinationReference)}</p><p className="mt-1 text-xs text-black/45">Demandé le {new Date(payout.requestedAt).toLocaleString("fr-FR")}</p>{payout.failureReason && <p className="mt-2 text-xs text-red-700">Motif : {payout.failureReason}</p>}</div><span className="rounded-full bg-black/5 px-2.5 py-1 text-xs">{payout.status}</span></div>{canManagePayouts && payout.status === "pending" && <div className="mt-3 border-t border-black/5 pt-3"><PayoutActions payoutId={payout.id} /></div>}</article>)}</div>}
    </section>
  </div>;
}
