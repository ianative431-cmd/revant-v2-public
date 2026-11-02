import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import AdminDataTable from "../_components/AdminDataTable";

export const dynamic = "force-dynamic";

function mask(value: string | null) {
  if (!value) return null;
  return "••••" + value.slice(-4);
}

export default async function AdminRetraitsPage() {
  await requirePermission("finance.view");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("payouts")
    .select("id, seller_id, amount, currency, status, provider, destination_type, destination_reference, requested_at, approved_at, paid_at, failure_reason")
    .order("requested_at", { ascending: false }).limit(100);
  if (error) throw new Error("Impossible de charger les retraits.");
  const rows = (data ?? []).map((item) => ({
    id: item.id.slice(0, 8),
    vendeur: item.seller_id.slice(0, 8),
    montant: `${Number(item.amount).toLocaleString("fr-FR")} ${item.currency}`,
    statut: item.status,
    prestataire: item.provider,
    destination: item.destination_type,
    référence: mask(item.destination_reference),
    demandé: new Date(item.requested_at).toLocaleString("fr-FR"),
    approuvé: item.approved_at ? new Date(item.approved_at).toLocaleString("fr-FR") : null,
    payé: item.paid_at ? new Date(item.paid_at).toLocaleString("fr-FR") : null,
    motif: item.failure_reason,
  }));
  return <section className="space-y-4"><header><h1 className="text-xl font-bold">Retraits vendeurs</h1><p className="mt-1 text-sm text-black/55">Vue détaillée des demandes réelles. Les coordonnées de destination sont masquées. L&apos;approbation et le rejet restent dans le module Finance avec ses contrôles serveur.</p></header><AdminDataTable rows={rows} columns={[{key:"id",label:"Retrait"},{key:"vendeur",label:"Vendeur"},{key:"montant",label:"Montant"},{key:"statut",label:"Statut"},{key:"prestataire",label:"Prestataire"},{key:"destination",label:"Type destination"},{key:"référence",label:"Destination masquée"},{key:"demandé",label:"Demandé le"},{key:"approuvé",label:"Approuvé le"},{key:"payé",label:"Payé le"},{key:"motif",label:"Motif"}]} /></section>;
}
