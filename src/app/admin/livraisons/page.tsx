import { getAdminDeliveryOperations } from "@/server/admin/operations";

const STATUS_LABEL: Record<string, string> = { unassigned: "Non attribuée", assigned: "Attribuée", picked_up: "Récupérée", in_transit: "En transit", delivered: "Livrée", failed: "Échec", cancelled: "Annulée" };

export default async function AdminDeliveriesPage() {
  const { deliveries, drivers, companies, orders } = await getAdminDeliveryOperations();
  const driverById = new Map(drivers.map((driver) => [driver.id, driver]));
  const companyById = new Map(companies.map((company) => [company.id, company]));
  const orderById = new Map(orders.map((order) => [order.id, order]));
  return <div className="space-y-5">
    <header><h1 className="text-xl font-bold">Livraisons</h1><p className="mt-1 text-sm text-black/55">Suivi réel des livraisons, chauffeurs et transporteurs. Les adresses et codes de remise ne sont pas affichés dans cette vue générale.</p></header>
    <div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/50">Livraisons enregistrées</p><p className="mt-1 text-2xl font-bold">{deliveries.length}</p></div>
    <section className="rounded-2xl bg-white p-4"><h2 className="font-semibold">Dernières livraisons</h2>
      {deliveries.length === 0 ? <p className="mt-3 text-sm text-black/50">Aucune livraison enregistrée pour le moment.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-black/50"><tr><th className="py-2 pr-3">Commande</th><th className="py-2 pr-3">Statut</th><th className="py-2 pr-3">Chauffeur</th><th className="py-2 pr-3">Transporteur</th><th className="py-2 pr-3">Attribuée le</th><th className="py-2">Livrée le</th></tr></thead><tbody>{deliveries.map((delivery) => { const driver = delivery.driver_id ? driverById.get(delivery.driver_id) : null; const company = delivery.company_id ? companyById.get(delivery.company_id) : null; const order = orderById.get(delivery.order_id); return <tr key={delivery.id} className="border-t border-black/5"><td className="py-3 pr-3 font-mono text-xs">{order?.order_number ?? delivery.order_id.slice(0, 8)}</td><td className="py-3 pr-3">{STATUS_LABEL[delivery.status] ?? delivery.status}</td><td className="py-3 pr-3">{driver ? `${driver.full_name}${driver.vehicle_type ? ` · ${driver.vehicle_type}` : ""}` : "Non attribué"}</td><td className="py-3 pr-3">{company?.name ?? "—"}</td><td className="py-3 pr-3">{delivery.assigned_at ? new Date(delivery.assigned_at).toLocaleDateString("fr-FR") : "—"}</td><td className="py-3">{delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleDateString("fr-FR") : "—"}</td></tr>; })}</tbody></table></div>}
    </section>
    <p className="text-xs text-black/45">Cette vue est en lecture seule : les changements de statut et l’affectation des chauffeurs nécessitent encore une action serveur dédiée avec permission de livraison.</p>
  </div>;
}
