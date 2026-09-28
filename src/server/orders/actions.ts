"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";

export type OrderActionState = { error: string | null; success?: boolean };

/**
 * Place une commande. Le prix et le titre ne sont JAMAIS pris depuis le
 * formulaire : on relit le vrai produit en base au moment de l'achat,
 * exactement comme le reste du projet ne fait jamais confiance à une
 * valeur envoyée par le client. La policy orders_buyer_insert (RLS)
 * revérifie de toute façon la même chose en base, indépendamment.
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
    .select("id, title, price_fcfa, status, shop_id, shops(name, owner_id)")
    .eq("id", productId)
    .maybeSingle();

  if (!product) {
    return { error: "Produit introuvable." };
  }
  if (product.status !== "active") {
    return { error: "Ce produit n'est plus disponible." };
  }
  const shop = Array.isArray(product.shops) ? product.shops[0] : product.shops;
  if (!shop) {
    return { error: "Boutique introuvable." };
  }
  if (shop.owner_id === user.id) {
    return { error: "Vous ne pouvez pas commander votre propre produit." };
  }

  const { error } = await supabase.from("orders").insert({
    product_id: product.id,
    shop_id: product.shop_id,
    buyer_id: user.id,
    product_title: product.title,
    shop_name: shop.name,
    price_fcfa: product.price_fcfa,
    status: "en_attente",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Cet article a déjà une commande en attente d'un autre acheteur." };
    }
    return { error: "Impossible de créer la commande." };
  }

  revalidatePath(`/produit/${productId}`);
  revalidatePath("/compte/commandes");
  return { error: null, success: true };
}

/**
 * Confirme une commande : le vendeur atteste avoir réellement reçu le
 * paiement (hors app) et livré. Le trigger orders_after_confirm
 * (migration 0011) fait passer le produit à "sold" dans la MÊME
 * transaction — jamais deux écritures séparées qui pourraient diverger.
 */
export async function confirmOrder(
  _prevState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();

  const orderId = String(formData.get("orderId") ?? "");
  const { error } = await supabase.from("orders").update({ status: "confirmee" }).eq("id", orderId);

  if (error) {
    return { error: "Impossible de confirmer cette commande." };
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
  const { error } = await supabase.from("orders").update({ status: "annulee" }).eq("id", orderId);

  if (error) {
    return { error: "Impossible d'annuler cette commande." };
  }

  revalidatePath("/compte/boutique/commandes");
  revalidatePath("/compte/commandes");
  return { error: null, success: true };
}
