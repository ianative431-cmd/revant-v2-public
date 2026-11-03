import Link from "next/link";
import { getAdminSettingsOverview } from "@/server/admin/settings-overview";

function safeValue(value: unknown) {
  const rendered = typeof value === "string" ? value : JSON.stringify(value);
  if (!rendered) return "—";
  return rendered.length > 160 ? `${rendered.slice(0, 157)}…` : rendered;
}

export default async function AdminSettingsPage() {
  const { settings, publicValues, providers, withdrawalRules } = await getAdminSettingsOverview();
  const publicValueByKey = new Map(publicValues.map((item) => [item.key, item.value]));
  return <div className="space-y-6">
    <header><h1 className="text-xl font-bold">Centre de configuration Revant</h1><p className="mt-1 text-sm text-black/55">Vue des paramètres réels de la plateforme. Les valeurs privées et secrets des prestataires ne sont jamais affichés.</p></header>
    <section className="rounded-2xl bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Paramètres enregistrés</h2><Link href="/admin/finance" className="text-xs font-semibold text-[#803e2f] underline underline-offset-4">Gérer la commission et la finance</Link></div>
      {settings.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucun paramètre enregistré.</p> : <div className="mt-3 space-y-2">{settings.map((item) => <article key={item.key} className="rounded-xl border border-black/5 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><code className="text-xs font-semibold">{item.key}</code><span className="rounded-full bg-black/5 px-2 py-1 text-[10px]">{item.value_type}</span></div><p className="mt-1 text-xs text-black/55">{item.description || "Aucune description."}</p><p className="mt-2 break-all text-xs text-black/70">{item.is_public ? safeValue(publicValueByKey.get(item.key)) : "Valeur privée masquée"}</p><p className="mt-1 text-[10px] text-black/35">Mis à jour · {new Date(item.updated_at).toLocaleString("fr-FR")}</p></article>)}</div>}
    </section>
    <section className="rounded-2xl bg-white p-4"><h2 className="font-semibold">Prestataires de paiement</h2>{providers.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucun prestataire enregistré.</p> : <div className="mt-3 space-y-2">{providers.map((provider) => <div key={provider.code} className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 py-3"><div><p className="text-sm font-medium">{provider.name}</p><p className="text-xs text-black/45">{provider.code} · {provider.supported_currencies.join(" · ")}</p></div><span className="text-xs">{provider.enabled ? "Activé" : "Désactivé"}</span></div>)}</div>}<p className="mt-2 text-xs text-black/40">Les clés API et configurations privées ne sont pas lues ni affichées.</p></section>
    <section className="rounded-2xl bg-white p-4"><h2 className="font-semibold">Règles de retrait</h2>{withdrawalRules.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucune règle de retrait configurée.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="text-xs text-black/50"><tr><th className="py-2 pr-3">Devise</th><th className="py-2 pr-3">Minimum</th><th className="py-2 pr-3">Maximum</th><th className="py-2 pr-3">Frais</th><th className="py-2 pr-3">KYC</th><th className="py-2">État</th></tr></thead><tbody>{withdrawalRules.map((rule) => <tr key={rule.currency} className="border-t border-black/5"><td className="py-3 pr-3">{rule.currency.trim()}</td><td className="py-3 pr-3">{Number(rule.min_amount).toLocaleString("fr-FR")}</td><td className="py-3 pr-3">{rule.max_amount === null ? "—" : Number(rule.max_amount).toLocaleString("fr-FR")}</td><td className="py-3 pr-3">{rule.fee_percent}% + {Number(rule.fee_amount).toLocaleString("fr-FR")}</td><td className="py-3 pr-3">{rule.kyc_required ? "Obligatoire" : "Non obligatoire"}</td><td className="py-3">{rule.enabled ? "Activée" : "Désactivée"}</td></tr>)}</tbody></table></div>}</section>
    <p className="text-xs text-black/45">Cette première version est en lecture seule. Les modifications de paramètres sensibles doivent passer par des actions auditées et des permissions explicites.</p>
  </div>;
}
