import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  ready_for_delivery: "Prête pour livraison",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  disputed: "En litige",
};

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  order_items: { product_name: string; shops: { name: string } | null }[];
};

export default async function AdminCommandesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total_amount, currency, created_at, order_items(product_name, shops(name))"
    )
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<OrderRow[]>();
  const orders = data ?? [];

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Commandes</h1>
      <p className="text-sm text-black/60 mb-6">
        {orders.length} commande{orders.length > 1 ? "s" : ""} (200 plus récentes) — paiement réglé
        hors app, confirmé par le vendeur.
      </p>

      {orders.length === 0 ? (
        <p className="text-sm text-black/40 bg-white rounded-2xl p-6 text-center">
          Aucune commande pour l&apos;instant.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const firstItem = order.order_items[0];
            const extraCount = order.order_items.length - 1;
            return (
              <div key={order.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {firstItem?.product_name ?? "Article indisponible"}
                    {extraCount > 0 ? ` +${extraCount}` : ""}
                  </p>
                  <p className="text-xs text-black/50 mt-0.5">
                    {firstItem?.shops?.name ?? "Boutique"} ·{" "}
                    {order.total_amount.toLocaleString("fr-FR")} {order.currency} ·{" "}
                    {new Date(order.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`text-[11px] shrink-0 rounded-full px-2 py-1 ${
                    order.status === "delivered"
                      ? "bg-black text-white"
                      : order.status === "cancelled" || order.status === "disputed"
                        ? "bg-red-50 text-red-600"
                        : "bg-black/5 text-black/60"
                  }`}
                >
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
