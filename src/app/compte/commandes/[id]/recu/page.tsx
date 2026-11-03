import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { getOrderById } from "@/server/orders/orders";
import { generateQrCodeDataUrl } from "@/lib/qr";
import { env } from "@/lib/env";

type Props = { params: Promise<{ id: string }> };

export default async function RecuPage({ params }: Props) {
  const { id } = await params;
  await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const order = await getOrderById(supabase, id);

  // RLS allows only the buyer or a seller attached to one of the order lines.
  // A receipt is available only after the delivery workflow has marked it delivered.
  if (!order || order.status !== "delivered" || order.items.length === 0) notFound();

  let buyerEmail: string | null = null;
  if (order.buyer_id) {
    try {
      const admin = createSupabaseAdminClient();
      const { data } = await admin.auth.admin.getUserById(order.buyer_id);
      buyerEmail = data.user?.email ?? null;
    } catch {
      buyerEmail = null;
    }
  }

  const verifyUrl = `${env.siteUrl()}/compte/commandes/${order.id}/recu`;
  const qrCodeDataUrl = await generateQrCodeDataUrl(verifyUrl);

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm">
        <Link href="/compte/commandes" className="text-sm underline text-brand-text/60">← Mes commandes</Link>
        <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-lg font-bold" style={{ fontFamily: "Georgia, serif" }}>Revant</span>
            <span className="text-xs text-brand-text/50">{new Date(order.delivered_at ?? order.updated_at).toLocaleDateString("fr-FR")}</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text/45">Reçu de commande</p>
          <p className="mt-1 text-sm font-semibold">{order.order_number}</p>
          <div className="mb-4 mt-4 space-y-3 border-y border-dashed border-brand-text/15 py-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0">{item.product_name} × {item.quantity}</span>
                <span className="shrink-0 font-medium">{Number(item.line_total).toLocaleString("fr-FR")} {item.currency.trim()}</span>
              </div>
            ))}
          </div>
          <div className="mb-6 flex justify-between text-sm font-bold">
            <span>Total de la commande</span>
            <span>{Number(order.total_amount).toLocaleString("fr-FR")} {order.currency.trim()}</span>
          </div>
          <dl className="mb-6 space-y-1 text-xs text-brand-text/50">
            <div className="flex justify-between"><dt>Statut</dt><dd>Livrée</dd></div>
            {buyerEmail && <div className="flex justify-between gap-3"><dt>Acheteur</dt><dd className="truncate">{buyerEmail}</dd></div>}
            <div className="flex justify-between"><dt>Référence</dt><dd className="font-mono">{order.id.slice(0, 8)}</dd></div>
          </dl>
          <div className="flex flex-col items-center border-t border-dashed border-brand-text/15 pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL générée côté serveur */}
            <img src={qrCodeDataUrl} alt="QR code de vérification du reçu de commande" width={120} height={120} />
            <p className="mt-2 text-center text-[10px] text-brand-text/40">Ce reçu confirme l’existence de la commande et son statut de livraison. Il ne constitue pas une preuve de paiement électronique.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
