import Link from "next/link";
import AdminDataTable from "../_components/AdminDataTable";
import { getAdminSettingsOverview } from "@/server/admin/settings-overview";

function safeValue(value: unknown) {
  const rendered = typeof value === "string" ? value : JSON.stringify(value);
  if (!rendered) return "—";
  return rendered.length > 160 ? `${rendered.slice(0, 157)}…` : rendered;
}

export default async function AdminSettingsPage() {
  const { settings, publicValues, providers, withdrawalRules } = await getAdminSettingsOverview();
  const publicValueByKey = new Map(publicValues.map((item) => [item.key, item.value]));
  const rows = settings
    .filter((item) => !/(secret|token|password|private_key|api_key)/i.test(item.key))
    .map((item) => ({
      id: item.key,
      clé: item.key,
      valeur: item.is_public ? safeValue(publicValueByKey.get(item.key)) : "Valeur privée masquée",
      type: item.value_type,
      description: item.description,
      visibilité: item.is_public ? "Publique" : "Privée",
      modifié: new Date(item.updated_at).toLocaleString("fr-FR"),
    }));

  return <section className="mx-auto max-w-6xl space-y-6">
    <header><h1 className="text-xl font-bold">Centre de configuration Revant</h1><p className="mt-1 text-sm text-black/55">Configuration réellement enregistrée dans Supabase. Les valeurs privées et secrets ne sont jamais affichés.</p></header>
    <section className="rounded-2xl bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Paramètres de la plateforme</h2><Link href="/admin/finance" className="text-xs font-semibold text-[#803e2f] underline underline-offset-4">Gérer la commission et la finance</Link></div>
      <AdminDataTable rows={rows} columns={[{key:"clé",label:"Paramètre"},{key:"valeur",label:"Valeur"},{key:"type",label:"Type"},{key:"description",label:"Description"},{key:"visibilité",label:"Visibilité"},{key:"modifié",label:"Dernière mise à jour"}]} />
    </section>
    <section className="rounded-2xl bg-white p-4"><h2 className="font-semibold">Prestataires de paiement</h2>{providers.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucun prestataire enregistré.</p> : <div className="mt-3 space-y-2">{providers.map((provider) => <div key={provider.code} className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 py-3"><div><p className="text-sm font-medium">{provider.name}</p><p className="text-xs text-black/45">{provider.code} · {provider.supported_currencies.join(" · ")}</p></div><span className="text-xs">{provider.enabled ? "Activé" : "Désactivé"}</span></div>)}</div>}<p className="mt-2 text-xs text-black/40">Les clés API et configurations privées ne sont pas lues ni affichées.</p></section>
    <section className="rounded-2xl bg-white p-4"><h2 className="font-semibold">Règles de retrait</h2>{withdrawalRules.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucune règle de retrait configurée.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="text-xs text-black/50"><tr><th className="py-2 pr-3">Devise</th><th className="py-2 pr-3">Minimum</th><th className="py-2 pr-3">Maximum</th><th className="py-2 pr-3">Frais</th><th className="py-2 pr-3">KYC</th><th className="py-2">État</th></tr></thead><tbody>{withdrawalRules.map((rule) => <tr key={rule.currency} className="border-t border-black/5"><td className="py-3 pr-3">{rule.currency.trim()}</td><td className="py-3 pr-3">{Number(rule.min_amount).toLocaleString("fr-FR")}</td><td className="py-3 pr-3">{rule.max_amount === null ? "—" : Number(rule.max_amount).toLocaleString("fr-FR")}</td><td className="py-3 pr-3">{rule.fee_percent}% + {Number(rule.fee_amount).toLocaleString("fr-FR")}</td><td className="py-3 pr-3">{rule.kyc_required ? "Obligatoire" : "Non obligatoire"}</td><td className="py-3">{rule.enabled ? "Activée" : "Désactivée"}</td></tr>)}</tbody></table></div>}</section>
    <p className="text-xs text-black/45">Cette page est en lecture seule. Les modifications sensibles doivent passer par des actions auditées et des permissions explicites.</p>
  </section>;
}
