import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import AdminDataTable from "../_components/AdminDataTable";

export const dynamic = "force-dynamic";

export default async function AdminAbonnementsPage() {
  await requirePermission("finance.view");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("store_subscriptions")
    .select("id, shop_id, owner_id, plan_name, amount, currency, status, provider, started_at, current_period_start, current_period_end, cancelled_at, created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Impossible de charger les abonnements.");
  const rows = (data ?? []).map((item) => ({
    id: item.id.slice(0, 8),
    boutique: item.shop_id.slice(0, 8),
    propriétaire: item.owner_id.slice(0, 8),
    offre: item.plan_name,
    tarif: `${Number(item.amount).toLocaleString("fr-FR")} ${item.currency}`,
    statut: item.status,
    prestataire: item.provider,
    début: item.started_at ? new Date(item.started_at).toLocaleDateString("fr-FR") : null,
    période: item.current_period_start && item.current_period_end ? `${new Date(item.current_period_start).toLocaleDateString("fr-FR")} – ${new Date(item.current_period_end).toLocaleDateString("fr-FR")}` : null,
    annulé: item.cancelled_at ? new Date(item.cancelled_at).toLocaleDateString("fr-FR") : null,
  }));
  return <section className="space-y-4"><header><h1 className="text-xl font-bold">Abonnements boutiques</h1><p className="mt-1 text-sm text-black/55">Historique des contrats enregistrés. Le tarif cible est de 5 000 XOF/mois, mais aucun renouvellement ou prélèvement automatique n&apos;est activé à ce stade.</p></header><AdminDataTable rows={rows} columns={[{key:"id",label:"Abonnement"},{key:"boutique",label:"Boutique"},{key:"propriétaire",label:"Propriétaire"},{key:"offre",label:"Offre"},{key:"tarif",label:"Tarif"},{key:"statut",label:"Statut"},{key:"prestataire",label:"Prestataire"},{key:"début",label:"Début"},{key:"période",label:"Période"},{key:"annulé",label:"Annulé le"}]} /></section>;
}
