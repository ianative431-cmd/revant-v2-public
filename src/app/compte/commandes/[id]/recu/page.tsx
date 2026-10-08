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

  // getOrderById passe par la RLS orders_read : si l'utilisateur n'est
  // ni l'acheteur, ni le vendeur, ni un admin, la ligne revient
  // simplement vide — donc 404, jamais une fuite de données d'un tiers.
  const order = await getOrderById(supabase, id);

  if (!order || order.status !== "confirmee") {
    notFound();
  }

  // E-mail de l'acheteur pour la version vendeur du reçu — nécessite le
  // client service role (auth.users n'est lisible par personne d'autre
  // que soi-même via le client normal).
  let buyerEmail: string | null = null;
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.auth.admin.getUserById(order.buyer_id);
    buyerEmail = data.user?.email ?? null;
  } catch {
    buyerEmail = null;
  }

  const verifyUrl = `${env.siteUrl()}/compte/commandes/${order.id}/recu`;
  const qrCodeDataUrl = await generateQrCodeDataUrl(verifyUrl);

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm">
        <Link href="/compte/commandes" className="text-sm underline text-brand-text/60">
          ← Mes commandes
        </Link>

        <div className="bg-white rounded-2xl p-6 mt-4 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-bold" style={{ fontFamily: "Georgia, serif" }}>
              Revant
            </span>
            <span className="text-xs text-brand-text/50">
              {order.confirmed_at
                ? new Date(order.confirmed_at).toLocaleDateString("fr-FR")
                : new Date(order.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>

          <div className="border-b border-dashed border-brand-text/15 pb-3 mb-3">
            <div className="flex justify-between text-xs text-brand-text/40 uppercase mb-2">
              <span>Description</span>
              <span>Montant</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="pr-3">{order.product_title}</span>
              <span className="font-medium whitespace-nowrap">
                {order.price_fcfa.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-semibold mb-6">
            <span>Total</span>
            <span>{order.price_fcfa.toLocaleString("fr-FR")} FCFA</span>
          </div>

          <dl className="text-xs text-brand-text/50 space-y-1 mb-6">
            <div className="flex justify-between">
              <dt>Vendu par</dt>
              <dd>{order.shop_name}</dd>
            </div>
            {buyerEmail && (
              <div className="flex justify-between">
                <dt>Acheteur</dt>
                <dd>{buyerEmail}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Référence</dt>
              <dd className="font-mono">{order.id.slice(0, 8)}</dd>
            </div>
          </dl>

          <div className="flex flex-col items-center border-t border-dashed border-brand-text/15 pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL générée côté serveur */}
            <img src={qrCodeDataUrl} alt="QR code de vérification du reçu" width={120} height={120} />
            <p className="text-[10px] text-brand-text/40 mt-2 text-center">
              Paiement réglé directement entre acheteur et vendeur — confirmé par le vendeur sur
              Revant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
