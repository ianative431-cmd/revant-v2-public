import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getOrdersForShop } from "@/server/orders/orders";
import { ConfirmOrderButton, CancelOrderButton } from "./OrderActions";
import type { OrderStatus } from "@/types/order";

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  unassigned: "En attente d’un livreur",
  assigned: "Livreur assigné",
  picked_up: "Commande récupérée",
  in_transit: "En route",
  delivered: "Livrée",
  failed: "Échec de livraison",
  cancelled: "Livraison annulée",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée par le vendeur",
  processing: "En préparation",
  ready_for_delivery: "Prête à livrer",
  shipped: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  disputed: "En litige",
};

export default async function BoutiqueCommandesPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) redirect("/compte/boutique");

  const orders = await getOrdersForShop(supabase, shop.id);

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
      <div className="w-full max-w-2xl">
        <Link href="/compte/boutique" className="text-sm underline text-brand-text/60">← Ma boutique</Link>
        <h1 className="mt-4 mb-1 text-xl font-bold">Commandes</h1>
        <p className="mb-6 text-sm text-brand-text/60">
          Confirme la prise en charge ou annule une commande avant son départ. Cette action ne valide ni le paiement ni la livraison.
        </p>
        {orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-text/60">Aucune commande pour l’instant.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const sellerTotal = order.items.reduce((sum, item) => sum + Number(item.line_total), 0);
              const currency = order.items[0]?.currency.trim() || order.currency.trim();
              return (
                <article key={order.id} className="rounded-2xl bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Commande {order.order_number}</p>
                      <p className="mt-1 text-xs text-brand-text/50">{new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-text/5 px-2.5 py-1 text-[11px] text-brand-text/70">{STATUS_LABEL[order.status]}</span>
                  </div>
                  <div className="mt-3 space-y-2 border-t border-brand-text/10 pt-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate">{item.product_name} × {item.quantity}</span>
                        <span className="shrink-0 font-semibold">{Number(item.line_total).toLocaleString("fr-FR")} {item.currency.trim()}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-bold">Total de tes articles : {sellerTotal.toLocaleString("fr-FR")} {currency}</p>
                  {(order.guest_name || order.guest_phone || order.guest_city || order.guest_address) && (
                    <div className="mt-3 rounded-xl bg-brand-bg/70 p-3 text-xs text-brand-text/70">
                      <p className="font-semibold">Coordonnées de livraison</p>
                      {order.guest_name && <p className="mt-1">{order.guest_name}</p>}
                      {order.guest_phone && <p>{order.guest_phone}</p>}
                      {order.guest_city && <p>{order.guest_city}</p>}
                      {order.guest_address && <p className="whitespace-pre-line">{order.guest_address}</p>}
                    </div>
                  )}
                  {(order.status === "pending" || order.status === "confirmed") && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.status === "pending" && <ConfirmOrderButton orderId={order.id} />}
                      <CancelOrderButton orderId={order.id} />
                    </div>
                  )}
                  {order.delivery && <div className="mt-3 rounded-xl bg-brand-bg/70 p-3 text-xs text-brand-text/70">
                    <p className="font-semibold">Livraison : {DELIVERY_STATUS_LABEL[order.delivery.status] ?? order.delivery.status}</p>
                    {order.delivery.delivery_address && <p className="mt-1">Destination : {order.delivery.delivery_address}</p>}
                  </div>}
                  {order.status === "delivered" && <Link href={`/compte/commandes/${order.id}/recu`} className="mt-3 inline-block text-xs underline text-brand-text/60">Voir le reçu de commande</Link>}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
