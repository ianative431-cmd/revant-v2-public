import Link from "next/link";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrdersForBuyer } from "@/server/orders/orders";

export default async function MesRecusPage() {
  await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const orders = await getOrdersForBuyer(supabase);
  const receipts = orders.filter((order) => order.status === "delivered" && order.items.length > 0);

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/parametres" className="text-sm font-medium text-brand-muted underline underline-offset-4">← Paramètres</Link>
        <header className="mb-6 mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">ACTIVITÉ</p>
          <h1 className="mt-2 text-2xl font-black">Mes reçus</h1>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">Les reçus disponibles correspondent aux commandes livrées.</p>
        </header>

        {receipts.length === 0 ? (
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 text-center">
            <p className="text-sm font-semibold">Aucun reçu disponible pour le moment.</p>
            <p className="mt-2 text-xs leading-relaxed text-brand-muted">Un reçu de commande apparaît ici lorsque la commande est livrée.</p>
            <Link href="/compte/commandes" className="mt-4 inline-flex rounded-full bg-brand-accent px-4 py-2.5 text-xs font-bold text-white">Consulter mes commandes</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((order) => (
              <article key={order.id} className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold">Reçu de commande {order.order_number}</h2>
                    <p className="mt-1 text-xs text-brand-muted">Livrée le {new Date(order.delivered_at ?? order.updated_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className="rounded-full bg-brand-accent/10 px-3 py-1 text-[11px] font-semibold text-brand-accent">Disponible</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-brand-border pt-3">
                  <p className="text-sm font-bold">{Number(order.total_amount).toLocaleString("fr-FR")} {order.currency.trim()}</p>
                  <Link href={`/compte/commandes/${order.id}/recu`} className="text-xs font-bold text-brand-accent underline underline-offset-4">Ouvrir le reçu →</Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-5 rounded-xl bg-brand-accent/5 p-3 text-xs leading-relaxed text-brand-muted">Ces documents confirment la commande et son statut de livraison. Ils ne constituent pas une preuve de paiement électronique.</p>
      </div>
    </main>
  );
}
