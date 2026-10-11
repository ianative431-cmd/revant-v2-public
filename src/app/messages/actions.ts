"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";

export async function sendTextMessage(formData: FormData) {
  const user = await requireUserWithLegalConsent();
  const conversationId = typeof formData.get("conversationId") === "string" ? String(formData.get("conversationId")) : "";
  const body = typeof formData.get("body") === "string" ? String(formData.get("body")).trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId) || !body || body.length > 2000) {
    redirect("/messages?status=invalid");
  }
  const supabase = await createSupabaseServerClient();
  const { data: conversation } = await supabase.from("conversations").select("id").eq("id", conversationId).maybeSingle();
  if (!conversation) redirect("/messages?status=unavailable");
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    type: "text",
    body,
  });
  if (error) redirect(`/messages/${conversationId}?status=error`);
  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  redirect(`/messages/${conversationId}`);
}


export async function startConversationAboutProduct(formData: FormData) {
  const user = await requireUserWithLegalConsent();
  const productId = typeof formData.get("productId") === "string" ? String(formData.get("productId")) : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) redirect("/messages?status=invalid");
  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase.from("products").select("id,shop_id,status").eq("id", productId).eq("status", "active").maybeSingle();
  if (!product?.shop_id) redirect("/messages?status=unavailable");
  const { data: shop } = await supabase.from("shops").select("id,owner_id").eq("id", product.shop_id).maybeSingle();
  if (!shop?.owner_id) redirect("/messages?status=unavailable");
  if (shop.owner_id === user.id) redirect(`/produit/${productId}`);
  const { data: existing } = await supabase.from("conversations").select("id").eq("buyer_id", user.id).eq("seller_id", shop.owner_id).eq("shop_id", shop.id).limit(1).maybeSingle();
  if (existing?.id) redirect(`/messages/${existing.id}`);
  const { data: created, error } = await supabase.from("conversations").insert({ buyer_id: user.id, seller_id: shop.owner_id, shop_id: shop.id }).select("id").single();
  if (error || !created?.id) redirect("/messages?status=unavailable");
  revalidatePath("/messages");
  redirect(`/messages/${created.id}`);
}
