import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import AdminDataTable from "../_components/AdminDataTable";

export const dynamic = "force-dynamic";

export default async function AdminPaiementsPage() {
  await requirePermission("finance.view");
  const supabase = createSupabaseAdminClient();
  const [{ data, error }, { data: setting }] = await Promise.all([
    supabase.from("payments").select("id, order_id, provider, status, amount, currency, provider_reference, created_at, paid_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("system_settings").select("value").eq("key", "revant.payments_enabled").maybeSingle(),
  ]);
  if (error) throw new Error("Impossible de charger les paiements.");
  const enabled = setting?.value === true;
  const rows = (data ?? []).map((item) => ({
    id: item.id.slice(0, 8),
    commande: item.order_id.slice(0, 8),
    prestataire: item.provider,
    statut: item.status,
    montant: `${Number(item.amount).toLocaleString("fr-FR")} ${item.currency}`,
    référence: item.provider_reference ? item.provider_reference.slice(-6).padStart(Math.min(6, item.provider_reference.length), "•") : null,
    créé: new Date(item.created_at).toLocaleString("fr-FR"),
    payé: item.paid_at ? new Date(item.paid_at).toLocaleString("fr-FR") : null,
  }));
  return <section className="space-y-4"><header><h1 className="text-xl font-bold">Suivi des paiements</h1><p className="mt-1 text-sm text-black/55">Historique technique des paiements enregistrés, sans action de débit ni de remboursement.</p></header><p className={enabled ? "rounded-xl bg-amber-50 p-3 text-sm text-amber-900" : "rounded-xl bg-black/5 p-3 text-sm text-black/65"}>{enabled ? "Le paramètre paiements est activé. Vérifier le prestataire et les webhooks avant toute opération réelle." : "Les paiements réels restent désactivés. Aucun prestataire n'est activé pour encaisser des clients."}</p><AdminDataTable rows={rows} columns={[{key:"id",label:"Paiement"},{key:"commande",label:"Commande"},{key:"prestataire",label:"Prestataire"},{key:"statut",label:"Statut"},{key:"montant",label:"Montant"},{key:"référence",label:"Référence masquée"},{key:"créé",label:"Créé le"},{key:"payé",label:"Payé le"}]} /></section>;
}
