import { requirePermission } from "@/server/auth/roles";
import { getAdminFinanceSnapshot } from "@/server/admin/finance";

function money(amount: number, currency: string) {
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ${currency.trim()}`;
}

export default async function AdminPaymentsPage() {
  await requirePermission("finance.view");
  const snapshot = await getAdminFinanceSnapshot();

  return <div className="space-y-6">
    <header><h1 className="text-xl font-bold">Paiements</h1><p className="mt-1 text-sm text-black/55">Transactions réellement enregistrées et état des prestataires configurés.</p></header>
    <section className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">Paiements confirmés</p><p className="mt-1 text-2xl font-bold">{snapshot.summary.paidPayments.toLocaleString("fr-FR")}</p></div>
      <div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">Volume payé</p><p className="mt-1 text-2xl font-bold">{snapshot.summary.paidVolume.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}</p><p className="text-xs text-black/40">Somme agrégée des transactions payées</p></div>
    </section>
    <section className="rounded-2xl bg-white p-4">
      <h2 className="font-semibold">Prestataires</h2>
      {snapshot.providers.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucun prestataire configuré dans la base.</p> : <div className="mt-3 grid gap-2 sm:grid-cols-2">{snapshot.providers.map((provider) => <div key={provider.code} className="rounded-xl border border-black/5 p-3"><div className="flex items-center justify-between gap-2"><span className="font-medium">{provider.name}</span><span className={`rounded-full px-2 py-1 text-xs ${provider.enabled ? "bg-green-100 text-green-800" : "bg-black/5 text-black/50"}`}>{provider.enabled ? "Activé" : "Désactivé"}</span></div><p className="mt-1 text-xs text-black/45">{provider.supportedCurrencies.join(" · ") || "Devises non précisées"}</p></div>)}</div>}
    </section>
    <section className="rounded-2xl bg-white p-4">
      <h2 className="font-semibold">Historique des transactions</h2>
      {snapshot.payments.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucun paiement enregistré pour le moment. Aucun paiement fictif n’est affiché.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs text-black/50"><tr><th className="py-2 pr-3">Commande</th><th className="py-2 pr-3">Prestataire</th><th className="py-2 pr-3">Montant</th><th className="py-2 pr-3">Statut</th><th className="py-2 pr-3">Référence</th><th className="py-2">Date</th></tr></thead><tbody>{snapshot.payments.map((payment) => <tr key={payment.id} className="border-t border-black/5"><td className="py-3 pr-3 font-mono text-xs">{payment.orderId.slice(0, 8)}</td><td className="py-3 pr-3">{payment.provider}</td><td className="py-3 pr-3">{money(payment.amount, payment.currency)}</td><td className="py-3 pr-3">{payment.status}</td><td className="py-3 pr-3 font-mono text-xs">{payment.providerReference ?? "—"}</td><td className="py-3">{new Date(payment.createdAt).toLocaleDateString("fr-FR")}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
