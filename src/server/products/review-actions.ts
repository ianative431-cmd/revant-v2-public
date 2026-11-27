"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";

export type ReviewActionState = {
  error: string | null;
  success: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function submitProductReview(
  _previousState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  void _previousState;

  const user = await requireUserWithLegalConsent();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const rating = Number(ratingRaw);

  if (!UUID_PATTERN.test(orderId) || !UUID_PATTERN.test(productId)) {
    return { error: "Référence de commande ou de produit invalide.", success: null };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Choisis une note entre 1 et 5.", success: null };
  }
  if (title.length > 120 || body.length < 10 || body.length > 2000) {
    return { error: "Le titre ne doit pas dépasser 120 caractères et le commentaire doit contenir entre 10 et 2 000 caractères.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,status")
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .eq("status", "delivered")
    .maybeSingle();

  if (orderError || !order) {
    return { error: "Seul l’acheteur d’une commande livrée peut déposer un avis.", success: null };
  }

  const { data: item, error: itemError } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderId)
    .eq("product_id", productId)
    .limit(1);

  if (itemError || !item?.length) {
    return { error: "Ce produit ne figure pas dans cette commande.", success: null };
  }

  // is_published is deliberately omitted: the database default and column
  // privileges force every buyer-submitted review into moderation.
  const { error } = await supabase.from("reviews").insert({
    user_id: user.id,
    product_id: productId,
    order_id: orderId,
    rating,
    title: title || null,
    body,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Un avis a déjà été envoyé pour ce produit et cette commande.", success: null };
    }
    console.error("Product review submission failed", error);
    return { error: "Impossible d’envoyer ton avis pour le moment. Réessaie plus tard.", success: null };
  }

  revalidatePath(`/compte/commandes/${orderId}`);
  revalidatePath(`/produit/${productId}`);
  return { error: null, success: "Avis envoyé. Il sera visible après validation par Revant." };
}
