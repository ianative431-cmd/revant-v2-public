import { getAdminReferrals } from "@/server/admin/operations";

function money(amount: number, currency: string) { return `${Number(amount).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ${currency.trim()}`; }

export default async function AdminReferralsPage() {
  const referrals = await getAdminReferrals();
  return <div className="space-y-5">
    <header><h1 className="text-xl font-bold">Parrainages</h1><p className="mt-1 text-sm text-black/55">Invitations, qualification et récompenses du programme de parrainage.</p></header>
    <div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">Parrainages enregistrés</p><p className="mt-1 text-2xl font-bold">{referrals.length}</p></div>
    <section className="rounded-2xl bg-white p-4"><h2 className="font-semibold">Historique</h2>
      {referrals.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucun parrainage enregistré.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="text-xs text-black/50"><tr><th className="py-2 pr-3">Code</th><th className="py-2 pr-3">Statut</th><th className="py-2 pr-3">Récompense</th><th className="py-2 pr-3">Qualifié le</th><th className="py-2 pr-3">Récompensé le</th><th className="py-2">Créé le</th></tr></thead><tbody>{referrals.map((item) => <tr key={item.id} className="border-t border-black/5"><td className="py-3 pr-3 font-mono text-xs">{item.referral_code}</td><td className="py-3 pr-3">{item.status}</td><td className="py-3 pr-3">{money(item.reward_amount, item.currency)}</td><td className="py-3 pr-3">{item.qualified_at ? new Date(item.qualified_at).toLocaleDateString("fr-FR") : "—"}</td><td className="py-3 pr-3">{item.rewarded_at ? new Date(item.rewarded_at).toLocaleDateString("fr-FR") : "—"}</td><td className="py-3">{new Date(item.created_at).toLocaleDateString("fr-FR")}</td></tr>)}</tbody></table></div>}
    </section>
    <p className="text-xs text-black/45">Les identités et coordonnées des participants ne sont pas affichées dans cette vue de suivi.</p>
  </div>;
}
