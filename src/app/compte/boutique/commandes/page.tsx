import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getOrdersForShop } from "@/server/orders/orders";
import { ConfirmOrderButton, CancelOrderButton } from "./OrderActions";

const STATUS_LABEL: Record<string, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  annulee: "Annulée",
};

export default async function BoutiqueCommandesPage() {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const shop = await getShopByOwnerId(supabase, user.id);

  if (!shop) redirect("/compte/boutique");

  const orders = await getOrdersForShop(supabase, shop.id);

  return (
    <div className="min-h-screen bg-[#F3E9DA] px-4 py-10 flex justify-center">
      <div className="w-full max-w-md">
        <Link href="/compte/boutique" className="text-sm underline text-black/60">
          ← Ma boutique
        </Link>
        <h1 className="text-xl font-bold mt-4 mb-1">Commandes</h1>
        <p className="text-sm text-black/60 mb-6">
          Paiement réglé directement avec l&apos;acheteur (hors app) — confirme ici une fois reçu et
          l&apos;article livré.
        </p>

        {orders.length === 0 ? (
          <p className="text-sm text-black/60 text-center py-10">
            Aucune commande pour l&apos;instant.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{order.product_title}</p>
                    <p className="text-xs text-black/50 mt-0.5">
                      {order.price_fcfa.toLocaleString("fr-FR")} FCFA ·{" "}
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
                {order.status === "en_attente" && (
                  <div className="flex gap-2 mt-3">
                    <ConfirmOrderButton orderId={order.id} />
                    <CancelOrderButton orderId={order.id} />
                  </div>
                )}
                {order.status === "confirmee" && (
                  <Link
                    href={`/compte/commandes/${order.id}/recu`}
                    className="inline-block text-xs underline text-black/60 mt-2"
                  >
                    Voir le reçu
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
