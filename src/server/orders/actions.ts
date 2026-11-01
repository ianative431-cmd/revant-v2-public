"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";

export type OrderActionState = { error: string | null; success?: boolean };

type OrderTransitionRpc = {
  rpc: (name: string, args: { p_order_id: string }) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function messageForOrderError(message: string, fallback: string) {
  if (message.includes("forbidden")) return "Tu n’es pas autorisé à modifier cette commande.";
  if (message.includes("invalid_order_transition")) return "Cette commande ne peut plus être modifiée à ce stade.";
  if (message.includes("product_unavailable_or_insufficient_stock")) return "Le produit n’est plus disponible en quantité suffisante. La commande reste en attente.";
  if (message.includes("invalid_order_shop_scope")) return "Cette commande doit être traitée par boutique. Contacte le support.";
  if (message.includes("order_not_found")) return "Commande introuvable.";
  return fallback;
}

async function runOrderTransition(
  formData: FormData,
  rpcName: "seller_confirm_order" | "seller_cancel_order" | "buyer_cancel_order",
  fallback: string
): Promise<OrderActionState> {
  await requireUserWithLegalConsent();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!UUID_PATTERN.test(orderId)) return { error: "Référence de commande invalide." };

  const supabase = await createSupabaseServerClient();
  const rpc = supabase as unknown as OrderTransitionRpc;
  const { error } = await rpc.rpc(rpcName, { p_order_id: orderId });
  if (error) return { error: messageForOrderError(error.message, fallback) };

  revalidatePath("/compte/boutique/commandes");
  revalidatePath("/compte/commandes");
  revalidatePath(`/compte/commandes/${orderId}/recu`);
  return { error: null, success: true };
}

/** Seller confirms order acceptance only. This does not mark a payment paid or a delivery completed. */
export async function confirmOrder(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  return runOrderTransition(formData, "seller_confirm_order", "Impossible de confirmer cette commande.");
}

/** Seller may cancel only an order that has not progressed beyond confirmation. */
export async function cancelOrder(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  return runOrderTransition(formData, "seller_cancel_order", "Impossible d’annuler cette commande.");
}

/** A buyer may cancel only their own order while it is still pending. */
export async function cancelBuyerOrder(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  return runOrderTransition(formData, "buyer_cancel_order", "Impossible d’annuler cette commande.");
}
