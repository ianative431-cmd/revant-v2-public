import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrdersForBuyer } from "@/server/orders/orders";

const STATUS_LABEL: Record<string, string> = {
  en_attente: "En attente de confirmation du vendeur",
  confirmee: "Confirmée",
  annulee: "Annulée",
};

export default async function MesCommandesPage() {
  await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const orders = await getOrdersForBuyer(supabase);

  return (
    <div className="min-h-screen bg-[#F3E9DA] px-4 py-10 flex justify-center">
      <div className="w-full max-w-md">
        <Link href="/compte" className="text-sm underline text-black/60">
          ← Mon compte
        </Link>
        <h1 className="text-xl font-bold mt-4 mb-6">Mes commandes</h1>

        {orders.length === 0 ? (
          <p className="text-sm text-black/60 text-center py-10">
            Aucune commande pour l&apos;instant.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4">
                <p className="text-sm font-medium">{order.product_title}</p>
                <p className="text-xs text-black/50 mt-0.5">
                  {order.shop_name} · {order.price_fcfa.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-xs text-black/40 mt-1">{STATUS_LABEL[order.status]}</p>
                {order.status === "confirmee" && (
                  <Link
                    href={`/compte/commandes/${order.id}/recu`}
                    className="inline-block text-xs underline mt-2"
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
