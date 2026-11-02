import { getAdminPromotions } from "@/server/admin/operations";
import PromotionActions from "./PromotionActions";

function money(amount: number | null) {
  return amount === null ? "—" : `${Number(amount).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} XOF`;
}

export default async function AdminPromotionsPage() {
  const { promotions, shops } = await getAdminPromotions();
  const shopById = new Map(shops.map((shop) => [shop.id, shop.name]));
  return <div className="space-y-5">
    <header><h1 className="text-xl font-bold">Promotions sponsorisées</h1><p className="mt-1 text-sm text-black/55">Suivi et modération des mises en avant de boutiques déjà enregistrées dans Revant.</p></header>
    <div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">Campagnes enregistrées</p><p className="mt-1 text-2xl font-bold">{promotions.length}</p></div>
    <section className="rounded-2xl bg-white p-4"><h2 className="font-semibold">Campagnes</h2>
      {promotions.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucune campagne sponsorisée enregistrée.</p> : <div className="mt-3 space-y-3">{promotions.map((item) => <article key={item.id} className="rounded-xl border border-black/5 p-3"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold">{shopById.get(item.shop_id) ?? `Boutique ${item.shop_id.slice(0, 8)}`}</p><p className="mt-1 text-xs text-black/50">{item.placement} · Budget {money(item.budget)}</p></div><span className="rounded-full bg-black/5 px-2.5 py-1 text-xs">{item.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-black/60 sm:grid-cols-4"><span>Vues : {Number(item.views ?? 0).toLocaleString("fr-FR")}</span><span>Visites : {Number(item.visits ?? 0).toLocaleString("fr-FR")}</span><span>Clics : {Number(item.clicks ?? 0).toLocaleString("fr-FR")}</span><span>Favoris : {Number(item.favorites ?? 0).toLocaleString("fr-FR")}</span></div><p className="mt-2 text-xs text-black/45">Ventes attribuées : {money(item.attributed_sales)} · {item.start_at ? new Date(item.start_at).toLocaleDateString("fr-FR") : "Date de début non définie"} – {item.end_at ? new Date(item.end_at).toLocaleDateString("fr-FR") : "sans date de fin"}</p><PromotionActions promotionId={item.id} status={item.status} /></article>)}</div>}
    </section>
    <p className="text-xs text-black/45">Les codes promo et remises appliqués au panier ne sont pas encore présents dans le schéma actuel. Cette page suit uniquement les boosts de boutiques existants. Chaque changement de statut est réservé aux administrateurs autorisés et inscrit dans le journal d’audit.</p>
  </div>;
}
