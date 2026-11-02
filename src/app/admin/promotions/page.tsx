import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import AdminDataTable from "../_components/AdminDataTable";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  await requirePermission("catalog.manage");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("store_promotions")
    .select("id, shop_id, status, placement, budget, start_at, end_at, views, visits, clicks, favorites, attributed_sales, created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Impossible de charger les promotions.");
  const rows = (data ?? []).map((item) => ({
    id: item.id.slice(0, 8),
    boutique: item.shop_id.slice(0, 8),
    statut: item.status,
    emplacement: item.placement,
    budget: `${Number(item.budget).toLocaleString("fr-FR")} XOF`,
    début: item.start_at ? new Date(item.start_at).toLocaleDateString("fr-FR") : null,
    fin: item.end_at ? new Date(item.end_at).toLocaleDateString("fr-FR") : null,
    vues: Number(item.views),
    visites: Number(item.visits),
    clics: Number(item.clicks),
    favoris: Number(item.favorites),
    ventes: `${Number(item.attributed_sales).toLocaleString("fr-FR")} XOF`,
  }));
  return <section className="space-y-4"><header><h1 className="text-xl font-bold">Promotions boutique</h1><p className="mt-1 text-sm text-black/55">Suivi des placements sponsorisés déjà enregistrés. Ce module ne représente pas encore un système de codes promo ou de réductions sur les commandes.</p></header><AdminDataTable rows={rows} columns={[{key:"id",label:"Campagne"},{key:"boutique",label:"Boutique"},{key:"statut",label:"Statut"},{key:"emplacement",label:"Placement"},{key:"budget",label:"Budget"},{key:"début",label:"Début"},{key:"fin",label:"Fin"},{key:"vues",label:"Vues"},{key:"visites",label:"Visites"},{key:"clics",label:"Clics"},{key:"favoris",label:"Favoris"},{key:"ventes",label:"Ventes attribuées"}]} /></section>;
}
