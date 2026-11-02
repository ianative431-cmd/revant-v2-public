import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import AdminDataTable from "../_components/AdminDataTable";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requirePermission("support.manage");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("conversations")
    .select("id, buyer_id, seller_id, shop_id, created_at, updated_at")
    .order("updated_at", { ascending: false }).limit(100);
  if (error) throw new Error("Impossible de charger les conversations.");
  const rows = (data ?? []).map((item) => ({
    id: item.id.slice(0, 8),
    acheteur: item.buyer_id.slice(0, 8),
    vendeur: item.seller_id.slice(0, 8),
    boutique: item.shop_id ? item.shop_id.slice(0, 8) : null,
    créée: new Date(item.created_at).toLocaleString("fr-FR"),
    activité: new Date(item.updated_at).toLocaleString("fr-FR"),
  }));
  return <section className="space-y-4"><header><h1 className="text-xl font-bold">Messagerie — conversations</h1><p className="mt-1 text-sm text-black/55">Vue de suivi des conversations réelles. Le contenu privé des messages n&apos;est pas exposé dans cet écran et aucune réponse administrative n&apos;est envoyée ici.</p></header><AdminDataTable rows={rows} columns={[{key:"id",label:"Conversation"},{key:"acheteur",label:"Acheteur"},{key:"vendeur",label:"Vendeur"},{key:"boutique",label:"Boutique"},{key:"créée",label:"Créée le"},{key:"activité",label:"Dernière activité"}]} /></section>;
}
