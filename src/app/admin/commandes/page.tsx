import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  annulee: "Annulée",
};

export default async function AdminCommandesPage() {
  const supabase = await createSupabaseServerClient();
  // orders_read (migration 0011) autorise déjà la lecture complète pour
  // un compte admin — pas besoin de service role ici.
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
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
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{order.product_title}</p>
                <p className="text-xs text-black/50 mt-0.5">
                  {order.shop_name} · {order.price_fcfa.toLocaleString("fr-FR")} FCFA ·{" "}
                  {new Date(order.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <span
                className={`text-[11px] shrink-0 rounded-full px-2 py-1 ${
                  order.status === "confirmee"
                    ? "bg-black text-white"
                    : order.status === "annulee"
                      ? "bg-red-50 text-red-600"
                      : "bg-black/5 text-black/60"
                }`}
              >
                {STATUS_LABEL[order.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
