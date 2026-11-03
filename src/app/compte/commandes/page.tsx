import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrdersForBuyer } from "@/server/orders/orders";
import BuyerOrderActions from "./BuyerOrderActions";
import type { OrderStatus } from "@/types/order";

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  unassigned: "Recherche d’un livreur",
  assigned: "Livreur assigné",
  picked_up: "Commande récupérée",
  in_transit: "En route",
  delivered: "Livrée",
  failed: "Incident de livraison",
  cancelled: "Livraison annulée",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "En attente de confirmation du vendeur",
  confirmed: "Confirmée par le vendeur",
  processing: "En préparation",
  ready_for_delivery: "Prête à livrer",
  shipped: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  disputed: "En litige",
};

export default async function MesCommandesPage() {
  await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const orders = await getOrdersForBuyer(supabase);

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
      <div className="w-full max-w-2xl">
        <Link href="/compte" className="text-sm underline text-brand-text/60">← Mon compte</Link>
        <h1 className="mt-4 mb-6 text-xl font-bold">Mes commandes</h1>
        {orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-text/60">Aucune commande pour l’instant.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Commande {order.order_number}</p>
                    <p className="mt-1 text-xs text-brand-text/50">{new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className="rounded-full bg-brand-text/5 px-2.5 py-1 text-[11px] text-brand-text/70">{STATUS_LABEL[order.status]}</span>
                </div>
                <div className="mt-3 space-y-2 border-t border-brand-text/10 pt-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{item.product_name} × {item.quantity}</span>
                      <span className="shrink-0 font-semibold">{Number(item.line_total).toLocaleString("fr-FR")} {item.currency.trim()}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm font-bold">Total : {Number(order.total_amount).toLocaleString("fr-FR")} {order.currency.trim()}</p>
                {order.delivery && <p className="mt-2 text-xs text-brand-text/55">Livraison : {DELIVERY_STATUS_LABEL[order.delivery.status] ?? order.delivery.status}</p>}
                {order.status === "pending" && <div className="mt-3"><BuyerOrderActions orderId={order.id} /></div>}
                {order.status === "delivered" && <Link href={`/compte/commandes/${order.id}/recu`} className="mt-3 inline-block text-xs underline text-brand-text/60">Voir le reçu de commande</Link>}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
