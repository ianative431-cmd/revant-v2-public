import Link from "next/link";
import { notFound } from "next/navigation";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Commande confirmée — Revant", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ token?: string }> };

export default async function GuestOrderConfirmationPage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (!token || token.length < 32 || token.length > 100) notFound();

  const hash = createHash("sha256").update(token).digest("hex");
  const db = createSupabaseAdminClient() as any;
  const { data: order } = await db
    .from("orders")
    .select("id, order_number, guest_name, guest_phone, delivery_city, total_amount, currency, status")
    .eq("guest_access_token_hash", hash)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await db
    .from("order_items")
    .select("product_name, quantity, line_total")
    .eq("order_id", order.id);

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10">
      <section className="max-w-md mx-auto bg-white rounded-[22px] p-6 shadow-sm">
        <p className="text-sm font-semibold text-brand-accent mb-2">Commande enregistrée</p>
        <h1 className="text-xl font-bold mb-2">Merci {order.guest_name}</h1>
        <p className="text-sm text-brand-text/70 mb-5">Ta commande a été enregistrée sans création de compte. Garde cette adresse privée pour retrouver cette confirmation.</p>
        <div className="rounded-xl bg-brand-bg p-4 mb-4">
          <p className="text-xs text-brand-text/60">Numéro de commande</p>
          <p className="font-semibold">{order.order_number}</p>
          {(items ?? []).map((item: { product_name: string; quantity: number; line_total: number }, index: number) => (
            <div key={index} className="flex justify-between gap-3 text-sm mt-3">
              <span>{item.product_name} × {item.quantity}</span>
              <span>{Number(item.line_total).toLocaleString("fr-FR")} {order.currency}</span>
            </div>
          ))}
          <div className="border-t mt-3 pt-3 flex justify-between text-sm font-bold">
            <span>Total produit</span>
            <span>{Number(order.total_amount).toLocaleString("fr-FR")} {order.currency}</span>
          </div>
        </div>
        <p className="text-sm text-brand-text/70">Le vendeur te contactera au {order.guest_phone} pour confirmer les détails de livraison à {order.delivery_city}. Aucun paiement en ligne n'a été débité.</p>
        <Link href="/" className="block text-center bg-brand-accent text-white rounded-full py-3 text-sm font-medium mt-5">Continuer les achats</Link>
      </section>
    </main>
  );
}
