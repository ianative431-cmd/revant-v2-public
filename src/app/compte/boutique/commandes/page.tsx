import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getOrdersForShop } from "@/server/orders/orders";
import { ConfirmOrderButton, CancelOrderButton } from "./OrderActions";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  ready_for_delivery: "Prête à livrer",
  shipped: "Expédiée",
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
      <div className="w-full max-w-md">
        <Link href="/compte/boutique" className="text-sm underline text-brand-text/60">← Ma boutique</Link>
        <h1 className="text-xl font-bold mt-4 mb-1">Commandes</h1>
        <p className="text-sm text-brand-text/60 mb-6">
          Les commandes sans compte incluent le téléphone et l'adresse fournis par l'acheteur. Contacte-le avant de confirmer.
        </p>

        {orders.length === 0 ? (
          <p className="text-sm text-brand-text/60 text-center py-10">Aucune commande pour l'instant.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{order.order_items.map((item) => item.product_name).join(", ") || "Commande"}</p>
                    <p className="text-xs text-brand-text/50 mt-1">
                      {Number(order.total_amount).toLocaleString("fr-FR")} {order.currency} · {new Date(order.placed_at ?? order.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-[11px] text-brand-text/50 mt-1">Référence : {order.order_number}</p>
                  </div>
                  <span className={`text-[11px] shrink-0 rounded-full px-2 py-1 ${order.status === "delivered" ? "bg-brand-accent text-white" : order.status === "cancelled" ? "bg-red-50 text-red-600" : "bg-brand-text/5 text-brand-text/60"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                {order.guest_name && (
                  <div className="mt-3 rounded-xl bg-brand-bg/60 p-3 text-xs space-y-1">
                    <p className="font-semibold">Acheteur sans compte</p>
                    <p>{order.guest_name} · {order.guest_phone}</p>
                    <p>{order.guest_city} — {order.guest_address}</p>
                  </div>
                )}
                {order.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <ConfirmOrderButton orderId={order.id} />
                    <CancelOrderButton orderId={order.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
