"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { checkRateLimit } from "@/server/security/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function reviewRedirect(productId: string, status: string): never {
  redirect(`/produit/${productId}?review=${status}#product-review-form`);
}

export async function submitProductReview(formData: FormData): Promise<void> {
  const user = await requireUserWithLegalConsent();
  const productId = String(formData.get("productId") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (
    !UUID_RE.test(productId) ||
    !UUID_RE.test(orderId) ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    title.length > 120 ||
    body.length < 10 ||
    body.length > 2000
  ) {
    reviewRedirect(UUID_RE.test(productId) ? productId : "", "invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .eq("status", "delivered")
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) reviewRedirect(productId, "not-eligible");

  const { data: matchingItem, error: itemError } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderId)
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();

  if (itemError) throw itemError;
  if (!matchingItem) reviewRedirect(productId, "not-eligible");

  const { data: existingReview, error: existingError } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("order_id", orderId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingReview) reviewRedirect(productId, "already");

  const allowed = await checkRateLimit(`product-review:${user.id}:${productId}`, 5, 86400);
  if (!allowed) reviewRedirect(productId, "limited");

  const { error: insertError } = await supabase.from("reviews").insert({
    user_id: user.id,
    order_id: orderId,
    product_id: productId,
    rating,
    title: title || null,
    body,
  });

  if (insertError) {
    if (insertError.code === "23505") reviewRedirect(productId, "already");
    console.error("[product-review] submission failed", insertError.message);
    reviewRedirect(productId, "error");
  }

  revalidatePath(`/produit/${productId}`);
  reviewRedirect(productId, "submitted");
}
