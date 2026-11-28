import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getOrderById } from "@/server/orders/orders";
import BuyerOrderActions from "../BuyerOrderActions";
import CreateDisputeForm from "@/components/disputes/CreateDisputeForm";
import type { OrderStatus } from "@/types/order";

type Props = { params: Promise<{ id: string }> };

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "En attente de confirmation",
  confirmed: "Confirmée par le vendeur",
  processing: "En préparation",
  ready_for_delivery: "Prête à livrer",
  shipped: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  disputed: "En litige",
};

const DISPUTE_ELIGIBLE_ORDER_STATUSES = new Set(["confirmed", "processing", "ready_for_delivery", "shipped", "delivered", "disputed"]);

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  unassigned: "Recherche d’un livreur",
  assigned: "Livreur assigné",
  picked_up: "Commande récupérée",
  in_transit: "En route vers l’adresse",
  delivered: "Livraison terminée",
  failed: "Incident de livraison",
  cancelled: "Livraison annulée",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Niamey",
  });
}

export default async function BuyerOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const order = await getOrderById(supabase, id);

  // Sellers may also see orders through RLS; this route is strictly buyer-only.
  if (!order || order.buyer_id !== user.id) notFound();

  const { data: dispute, error: disputeError } = await supabase.from("disputes").select("id,status,reason,description,resolution_note,created_at,resolved_at").eq("order_id", id).maybeSingle();
  if (disputeError) throw disputeError;

  const delivery = order.delivery;
  const deliveryStatus = delivery?.status ?? null;
  let savedAddress: {
    label: string | null;
    recipient_name: string;
    phone: string;
    address_line: string;
    city: string;
    country_code: string;
  } | null = null;
  if (order.shipping_address_id) {
    const { data, error } = await supabase
      .from("addresses")
      .select("label,recipient_name,phone,address_line,city,country_code")
      .eq("id", order.shipping_address_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    savedAddress = data;
  }
  const address = delivery?.delivery_address ||
    [order.guest_city, order.guest_address].filter(Boolean).join(" — ") ||
    [savedAddress?.address_line, savedAddress?.city, savedAddress?.country_code].filter(Boolean).join(" — ");
  const timeline = [
    { label: "Demande de commande créée", at: order.placed_at ?? order.created_at },
    { label: "Commande confirmée par le vendeur", at: order.confirmed_at },
    { label: "Livraison demandée", at: delivery?.requested_at ?? null },
    { label: "Livreur assigné", at: delivery?.assigned_at ?? null },
    { label: "Commande récupérée", at: delivery?.picked_up_at ?? null },
    { label: "Commande livrée", at: delivery?.delivered_at ?? order.delivered_at },
    { label: "Commande annulée", at: order.cancelled_at },
  ].filter((event): event is { label: string; at: string } => Boolean(event.at))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <main className="revant-buyer-order-detail min-h-screen bg-brand-bg px-4 py-8 text-brand-text">
      <div className="revant-buyer-order-detail-layout mx-auto max-w-4xl">
        <Link href="/compte/commandes" className="text-sm text-[var(--brand-muted)] transition hover:text-brand-accent">← Mes commandes</Link>

        <header className="revant-order-status-panel mt-5 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[var(--brand-accent)]">Suivi de commande</p>
              <h1 className="mt-1 text-2xl font-black">Commande {order.order_number}</h1>
              <p className="mt-2 text-xs text-[var(--brand-muted)]">Créée le {formatDate(order.created_at)}</p>
            </div>
            <span className="rounded-full bg-[var(--brand-bg)] px-3 py-2 text-xs font-bold">{STATUS_LABEL[order.status]}</span>
          </div>

          {delivery && (
            <div className="mt-5 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-4">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-muted)]">État de la livraison</p>
              <p className="mt-1 text-sm font-extrabold">{DELIVERY_STATUS_LABEL[deliveryStatus ?? ""] ?? deliveryStatus}</p>
              {delivery.driver_id && (
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Un livreur est associé à cette livraison. Ses coordonnées ne sont affichées que lorsqu’elles sont disponibles et autorisées.</p>
              )}
              {deliveryStatus === "failed" && (
                <>
                  <p className="mt-2 text-xs text-[var(--brand-muted)]">Un incident a été signalé. La boutique et Revant peuvent suivre la situation.</p>
                  {delivery.failure_reason && <p className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-900">Motif communiqué : {delivery.failure_reason}</p>}
                </>
              )}
            </div>
          )}
        </header>

        <section className="revant-order-content-panel mt-5 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm sm:p-6" aria-labelledby="order-items-title">
          <h2 id="order-items-title" className="text-base font-black">Articles commandés</h2>
          <div className="mt-4 divide-y divide-[var(--brand-border)]">
            {order.items.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{item.product_name}</p>
                  <p className="mt-1 text-xs text-[var(--brand-muted)]">Quantité : {item.quantity}{item.variant_label ? ` · Taille : ${item.variant_label}` : ""} · {Number(item.unit_price).toLocaleString("fr-FR")} {item.currency.trim()} / unité</p>
                </div>
                <p className="shrink-0 text-sm font-extrabold">{Number(item.line_total).toLocaleString("fr-FR")} {item.currency.trim()}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 border-t border-[var(--brand-border)] pt-4">
            <div className="flex justify-between gap-3 text-sm"><span className="text-[var(--brand-muted)]">Sous-total enregistré</span><span className="font-bold">{Number(order.subtotal).toLocaleString("fr-FR")} {order.currency.trim()}</span></div>
            <div className="mt-2 flex justify-between gap-3 text-sm"><span className="text-[var(--brand-muted)]">Frais de livraison</span><span className="font-bold">{Number(order.delivery_fee) > 0 ? `${Number(order.delivery_fee).toLocaleString("fr-FR")} ${order.currency.trim()}` : "À confirmer"}</span></div>
            <div className="mt-3 flex justify-between gap-3 border-t border-[var(--brand-border)] pt-3"><span className="text-sm font-extrabold">Montant enregistré</span><span className="text-base font-black text-brand-accent">{Number(order.total_amount).toLocaleString("fr-FR")} {order.currency.trim()}</span></div>
            {Number(order.delivery_fee) === 0 && <p className="mt-2 text-[10px] leading-relaxed text-[var(--brand-muted)]">Le montant affiché n’inclut pas de frais de livraison confirmés. La boutique doit les préciser avant tout règlement.</p>}
          </div>
        </section>

        <section className="revant-order-content-panel mt-5 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm sm:p-6" aria-labelledby="order-timeline-title">
          <h2 id="order-timeline-title" className="text-base font-black">Historique réel</h2>
          {timeline.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--brand-muted)]">Aucun événement horodaté n’est encore enregistré.</p>
          ) : (
            <ol className="mt-5 space-y-4">
              {timeline.map((event, index) => (
                <li key={`${event.label}-${event.at}`} className="relative flex gap-3">
                  <span className="relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--brand-bg)] text-[10px] font-black text-brand-accent">{index + 1}</span>
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-sm font-bold">{event.label}</p>
                    <time className="mt-1 block text-xs text-[var(--brand-muted)]" dateTime={event.at}>{formatDate(event.at)}</time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {(address || savedAddress) && (
          <section className="mt-5 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm" aria-labelledby="order-address-title">
            <h2 id="order-address-title" className="text-sm font-black">Adresse de livraison enregistrée</h2>
            {savedAddress?.label && <p className="mt-2 text-xs font-bold text-[var(--brand-muted)]">{savedAddress.label}</p>}
            {savedAddress?.recipient_name && <p className="mt-2 text-sm font-semibold">{savedAddress.recipient_name}</p>}
            {savedAddress?.phone && <p className="mt-1 text-xs text-[var(--brand-muted)]">{savedAddress.phone}</p>}
            {address && <p className="mt-2 text-sm leading-relaxed text-[var(--brand-muted)]">{address}</p>}
          </section>
        )}

        <section className="revant-order-content-panel mt-5 rounded-[26px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-sm sm:p-6" aria-labelledby="order-dispute-title">
          <h2 id="order-dispute-title" className="text-base font-black">Assistance et litiges</h2>
          {dispute ? (
            <div className="mt-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--brand-muted)]">Dossier {dispute.id.slice(0, 8)} · {dispute.status === "open" ? "Ouvert" : dispute.status === "under_review" ? "En cours d’examen" : dispute.status === "resolved_buyer" ? "Résolu en ta faveur" : dispute.status === "resolved_seller" ? "Résolu en faveur du vendeur" : dispute.status === "rejected" ? "Rejeté" : "Clôturé"}</p>
              <p className="mt-2 text-sm font-bold">{dispute.reason}</p>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[var(--brand-muted)]">{dispute.description}</p>
              {dispute.resolution_note && <div className="mt-3 border-t border-[var(--brand-border)] pt-3"><p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--brand-muted)]">Réponse du support</p><p className="mt-1 whitespace-pre-wrap text-sm">{dispute.resolution_note}</p></div>}
            </div>
          ) : DISPUTE_ELIGIBLE_ORDER_STATUSES.has(order.status) ? (
            <div className="mt-3 space-y-2"><p className="text-xs leading-relaxed text-[var(--brand-muted)]">Si un problème sérieux concerne cette commande, transmets les faits au support Revant.</p><CreateDisputeForm orderId={order.id} /></div>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-[var(--brand-muted)]">L’ouverture d’un litige devient possible après confirmation de la commande par le vendeur.</p>
          )}
        </section>
        <div className="mt-5 flex flex-wrap gap-3">
          {order.status === "pending" && <BuyerOrderActions orderId={order.id} />}
          {order.status === "delivered" && (
            <Link href={`/compte/commandes/${order.id}/recu`} className="rounded-full bg-brand-accent px-5 py-3 text-xs font-bold text-white">Voir le reçu</Link>
          )}
        </div>
      </div>
    </main>
  );
}
