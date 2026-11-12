import Link from "next/link";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptDeliveryCode } from "@/server/delivery/code-crypto.mjs";

type GuestOrderSummary = {
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  product_name: string;
  shop_name: string;
  created_at: string;
  delivery_status?: string | null;
  delivery_code_ciphertext?: string | null;
  delivery_code_hint?: string | null;
};
type GuestOrderLookup = {
  rpc: (name: string, args: Record<string, string>) => Promise<{ data: GuestOrderSummary | null; error: { message: string } | null }>;
};

type Props = { searchParams: Promise<{ numero?: string }> };

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  unassigned: "En attente d’un livreur",
  assigned: "Livreur assigné",
  picked_up: "Commande récupérée",
  in_transit: "En route",
  delivered: "Livrée",
  failed: "Incident de livraison",
  cancelled: "Livraison annulée",
};

const STATUS_LABEL: Record<string, string> = {
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

export default async function GuestOrderConfirmation({ searchParams }: Props) {
  const { numero } = await searchParams;
  if (!numero || !/^RVT-[A-Z0-9-]{8,40}$/.test(numero)) notFound();
  const cookieStore = await cookies();
  const token = cookieStore.get(`revant_guest_${numero}`)?.value;
  if (!token) notFound();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const supabase = createSupabaseAdminClient();
  const guestRpc = supabase as unknown as GuestOrderLookup;
  const { data, error } = await guestRpc.rpc("get_guest_order", { p_order_number: numero, p_tracking_token_hash: tokenHash });
  if (error || !data) notFound();
  const deliverySecret = process.env.DELIVERY_CODE_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  let deliveryCode: string | null = null;
  if (data.delivery_code_ciphertext && deliverySecret) {
    try { deliveryCode = decryptDeliveryCode(data.delivery_code_ciphertext, deliverySecret); } catch { deliveryCode = null; }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-10 text-[#111]">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-2xl">✓</div>
        <p className="mt-5 text-xs font-bold tracking-widest text-neutral-500">COMMANDE ENREGISTRÉE</p>
        <h1 className="mt-2 text-2xl font-black">Merci pour ta commande.</h1>
        <p className="mt-3 text-sm text-neutral-600">Garde ce numéro pour retrouver ta commande et contacter la boutique.</p>
        <p className="mt-5 rounded-xl bg-neutral-50 p-4 text-lg font-black">{data.order_number}</p>
        <div className="mt-5 rounded-xl border border-neutral-200 p-4 text-left">
          <p className="text-sm font-bold">{data.product_name}</p>
          <p className="mt-1 text-xs text-neutral-500">Boutique : {data.shop_name}</p>
          <p className="mt-3 text-lg font-black">{Number(data.total_amount).toLocaleString("fr-FR")} {data.currency}</p>
          <p className="mt-2 text-xs text-neutral-500">Statut : {STATUS_LABEL[data.status] ?? data.status}</p>
          {data.delivery_status && <p className="mt-2 text-xs text-neutral-500">Livraison : {DELIVERY_STATUS_LABEL[data.delivery_status] ?? data.delivery_status}</p>}
        </div>
        {deliveryCode && <div className="mt-4 rounded-xl border border-[var(--brand-accent)]/20 bg-[var(--brand-accent)]/5 p-4 text-left"><p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-accent)]">Code de remise</p><p className="mt-2 text-2xl font-black tracking-[0.3em]">{deliveryCode}</p><p className="mt-2 text-xs leading-relaxed text-neutral-600">Ne communique ce code au livreur qu’au moment où il te remet physiquement la commande.</p></div>}
        {!deliveryCode && data.status !== "delivered" && <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-500">Le code de remise apparaîtra ici lorsque le vendeur aura demandé un livreur. Conserve cette page pour retrouver ton suivi.</p>}
        <p className="mt-4 text-xs leading-relaxed text-neutral-500">Le suivi de cette commande est protégé par un jeton privé sur cet appareil. Si tu es connecté, tu peux aussi la retrouver dans « Mes commandes ».</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-bold text-white">Retour à l’accueil</Link>
      </div>
    </main>
  );
}
