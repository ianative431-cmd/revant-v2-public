"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";

export type OrderActionState = { error: string | null; success?: boolean };

function generateOrderNumber(): string {
  return `RVT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}

/**
 * Place une commande. Le prix et le nom ne sont JAMAIS pris depuis le
 * formulaire : on relit le vrai produit en base au moment de l'achat,
 * exactement comme le reste du projet ne fait jamais confiance à une
 * valeur envoyée par le client. La policy RLS sur orders/order_items
 * revérifie de toute façon la même chose en base, indépendamment.
 *
 * Schéma actuel : une commande (orders) contient un ou plusieurs
 * articles (order_items) — ici toujours un seul pour l'instant, le
 * panier multi-articles n'est pas encore construit.
 */
export async function createOrder(
  _prevState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();

  const productId = String(formData.get("productId") ?? "");

  const { data: product } = await supabase
    .from("products")
    .select("id, name, base_price, currency, status, stock_quantity, shop_id, shops(name, owner_id)")
    .eq("id", productId)
    .maybeSingle();

  if (!product) {
    return { error: "Produit introuvable." };
  }
  if (product.status !== "active" || product.stock_quantity <= 0) {
    return { error: "Ce produit n'est plus disponible." };
  }
  const shop = Array.isArray(product.shops) ? product.shops[0] : product.shops;
  if (!shop) {
    return { error: "Boutique introuvable." };
  }
  if (shop.owner_id === user.id) {
    return { error: "Vous ne pouvez pas commander votre propre produit." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      order_number: generateOrderNumber(),
      status: "pending",
      currency: product.currency,
      subtotal: product.base_price,
      delivery_fee: 0,
      total_amount: product.base_price,
      placed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: "Impossible de créer la commande." };
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    shop_id: product.shop_id,
    product_name: product.name,
    quantity: 1,
    unit_price: product.base_price,
    line_total: product.base_price,
    currency: product.currency,
  });

  if (itemError) {
    // La commande ne doit jamais exister sans son article — on nettoie
    // plutôt que de laisser une commande vide et trompeuse.
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: "Impossible de créer la commande." };
  }

  revalidatePath(`/produit/${productId}`);
  revalidatePath("/compte/commandes");
  return { error: null, success: true };
}

/**
 * Confirme une commande : le vendeur atteste avoir réellement reçu le
 * paiement (hors app) et livré. Décrémente le stock des produits
 * commandés dans la foulée — jamais une seconde écriture qui pourrait
 * diverger si l'une des deux échoue silencieusement.
 */
export async function confirmOrder(
  _prevState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();

  const orderId = String(formData.get("orderId") ?? "");

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  const { error } = await supabase
    .from("orders")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending");

  if (error) {
    return { error: "Impossible de confirmer cette commande." };
  }

  for (const item of items ?? []) {
    await supabase.rpc("decrement_product_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
  }

  revalidatePath("/compte/boutique/commandes");
  revalidatePath("/compte/commandes");
  return { error: null, success: true };
}

export async function cancelOrder(
  _prevState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();

  const orderId = String(formData.get("orderId") ?? "");
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    return { error: "Impossible d'annuler cette commande." };
  }

  revalidatePath("/compte/boutique/commandes");
  revalidatePath("/compte/commandes");
  return { error: null, success: true };
}
