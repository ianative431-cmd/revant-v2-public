import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getOrdersForShop } from "@/server/orders/orders";
import { ConfirmOrderButton, CancelOrderButton } from "./OrderActions";
import RequestDeliveryButton from "./RequestDeliveryButton";
import CreateDisputeForm from "@/components/disputes/CreateDisputeForm";
import type { OrderStatus } from "@/types/order";

const DISPUTE_ELIGIBLE_ORDER_STATUSES = new Set(["confirmed", "processing", "ready_for_delivery", "shipped", "delivered", "disputed"]);

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
  const orderIds = orders.map((order) => order.id);
  const { data: disputes, error: disputesError } = orderIds.length ? await supabase.from("disputes").select("id,order_id,status,reason,resolution_note").in("order_id", orderIds) : { data: [], error: null };
  if (disputesError) throw disputesError;
  const disputeByOrder = new Map((disputes ?? []).map((dispute) => [dispute.order_id, dispute]));

  return (
    <div className="revant-seller-orders min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
      <div className="revant-seller-orders-layout w-full max-w-5xl">
        <Link href="/compte/boutique" className="text-sm font-semibold text-[var(--brand-muted)] underline decoration-[var(--brand-accent)] underline-offset-4">← Ma boutique</Link>
        <h1 className="mb-1 mt-4 text-2xl font-black tracking-tight text-[var(--brand-text)]">Commandes</h1>
        <p className="mb-6 text-sm leading-6 text-[var(--brand-muted)]">Confirme la prise en charge ou annule une commande avant son départ. Cette action ne valide ni le paiement ni la livraison.</p>
        {orders.length === 0 ? <p className="py-10 text-center text-sm text-brand-text/60">Aucune commande pour l’instant.</p> : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const sellerTotal = order.items.reduce((sum, item) => sum + Number(item.line_total), 0);
              const currency = order.items[0]?.currency.trim() || order.currency.trim();
              const dispute = disputeByOrder.get(order.id);
              return (
                <article key={order.id} className="revant-seller-order rounded-[22px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-sm sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="text-sm font-extrabold text-[var(--brand-text)]">Commande {order.order_number}</p><p className="mt-1 text-xs text-[var(--brand-muted)]">{new Date(order.created_at).toLocaleDateString("fr-FR")}</p></div>
                    <span className="shrink-0 rounded-full bg-[var(--brand-bg)] px-3 py-1.5 text-[11px] font-semibold text-[var(--brand-muted)]">{STATUS_LABEL[order.status]}</span>
                  </div>
                  <div className="mt-3 space-y-2 border-t border-[var(--brand-border)] pt-3">
                    {order.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate">{item.product_name} {item.variant_label ? `· Taille : ${item.variant_label}` : ""} × {item.quantity}</span><span className="shrink-0 font-semibold">{Number(item.line_total).toLocaleString("fr-FR")} {item.currency.trim()}</span></div>)}
                  </div>
                  <p className="mt-3 text-sm font-extrabold text-[var(--brand-text)]">Total de tes articles : {sellerTotal.toLocaleString("fr-FR")} {currency}</p>
                  {(order.guest_name || order.guest_phone || order.guest_city || order.guest_address) && <div className="mt-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3 text-xs text-[var(--brand-muted)]"><p className="font-semibold">Coordonnées de livraison</p>{order.guest_name && <p className="mt-1">{order.guest_name}</p>}{order.guest_phone && <p>{order.guest_phone}</p>}{order.guest_city && <p>{order.guest_city}</p>}{order.guest_address && <p className="whitespace-pre-line">{order.guest_address}</p>}</div>}
                  <section className="mt-4 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3">
                    <h2 className="text-xs font-extrabold">Assistance et litiges</h2>
                    {dispute ? (
                      <div className="mt-2">
                        <p className="text-xs font-bold">{dispute.status === "open" ? "Dossier ouvert" : dispute.status === "under_review" ? "En cours d’examen" : dispute.status === "resolved_buyer" ? "Résolu en faveur de l’acheteur" : dispute.status === "resolved_seller" ? "Résolu en ta faveur" : dispute.status === "rejected" ? "Rejeté" : "Clôturé"} · {dispute.reason}</p>
                        {dispute.resolution_note && <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--brand-muted)]">Décision du support : {dispute.resolution_note}</p>}
                      </div>
                    ) : DISPUTE_ELIGIBLE_ORDER_STATUSES.has(order.status) ? (
                      <div className="mt-2"><p className="mb-2 text-xs text-[var(--brand-muted)]">Signale un problème lié à cette commande au support Revant.</p><CreateDisputeForm orderId={order.id} /></div>
                    ) : (
                      <p className="mt-1 text-xs text-[var(--brand-muted)]">Un litige pourra être ouvert après confirmation de la commande.</p>
                    )}
                  </section>
                  {(order.status === "pending" || order.status === "confirmed") && <div className="mt-4 flex flex-wrap gap-2">{order.status === "pending" && <ConfirmOrderButton orderId={order.id} />}<CancelOrderButton orderId={order.id} /></div>}
                  {(order.delivery || order.status === "confirmed") && <div className="mt-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3 text-xs text-[var(--brand-muted)]">
                    {order.delivery && <p className="font-semibold">Livraison : {DELIVERY_STATUS_LABEL[order.delivery.status] ?? order.delivery.status}</p>}
                    {order.delivery?.delivery_address && <p className="mt-1">Destination : {order.delivery.delivery_address}</p>}
                    {order.status === "confirmed" && (!order.delivery || (order.delivery.status === "unassigned" && !order.delivery.requested_at)) && <div className="mt-2"><RequestDeliveryButton orderId={order.id} /></div>}
                    {order.delivery?.status === "unassigned" && order.delivery.requested_at && <p className="mt-1">Demande envoyée aux livreurs actifs.</p>}
                    {order.delivery?.status === "assigned" && <p className="mt-1">Un livreur a accepté la course.</p>}
                    {order.delivery?.status === "in_transit" && <p className="mt-1">Le colis est en route vers l’acheteur.</p>}
                    {order.delivery?.status === "failed" && <p className="mt-1 text-red-800">Incident signalé : {order.delivery.failure_reason || "Motif non renseigné"}</p>}
                  </div>}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
