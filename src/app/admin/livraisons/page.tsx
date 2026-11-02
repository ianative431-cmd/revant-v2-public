import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import AdminDataTable from "../_components/AdminDataTable";

export const dynamic = "force-dynamic";

export default async function AdminLivraisonsPage() {
  await requirePermission("support.manage");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("deliveries")
    .select("id, order_id, status, driver_id, pickup_address, delivery_address, assigned_at, picked_up_at, delivered_at, created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Impossible de charger les livraisons.");
  const rows = (data ?? []).map((item) => ({
    id: item.id.slice(0, 8),
    commande: item.order_id.slice(0, 8),
    statut: item.status,
    livreur: item.driver_id ? item.driver_id.slice(0, 8) : "Non affecté",
    départ: item.pickup_address,
    destination: item.delivery_address,
    affectée: item.assigned_at ? new Date(item.assigned_at).toLocaleString("fr-FR") : null,
    récupérée: item.picked_up_at ? new Date(item.picked_up_at).toLocaleString("fr-FR") : null,
    livrée: item.delivered_at ? new Date(item.delivered_at).toLocaleString("fr-FR") : null,
  }));
  return <section className="space-y-4"><header><h1 className="text-xl font-bold">Suivi des livraisons</h1><p className="mt-1 text-sm text-black/55">Suivi des enregistrements réels, 100 plus récents. Les transitions restent contrôlées par le workflow livreur existant.</p></header><AdminDataTable rows={rows} columns={[{key:"id",label:"Livraison"},{key:"commande",label:"Commande"},{key:"statut",label:"Statut"},{key:"livreur",label:"Livreur"},{key:"départ",label:"Départ"},{key:"destination",label:"Destination"},{key:"affectée",label:"Affectée le"},{key:"récupérée",label:"Récupérée le"},{key:"livrée",label:"Livrée le"}]} /></section>;
}
