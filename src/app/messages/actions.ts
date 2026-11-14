"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function hasBlockBetween(supabase: SupabaseClient, firstUserId: string, secondUserId: string) {
  const { data: directBlock } = await supabase
    .from("user_blocks")
    .select("blocker_id")
    .eq("blocker_id", firstUserId)
    .eq("blocked_id", secondUserId)
    .maybeSingle();
  if (directBlock) return true;

  const { data: reverseBlock } = await supabase
    .from("user_blocks")
    .select("blocker_id")
    .eq("blocker_id", secondUserId)
    .eq("blocked_id", firstUserId)
    .maybeSingle();
  return Boolean(reverseBlock);
}

export async function sendTextMessage(formData: FormData) {
  const user = await requireUserWithLegalConsent();
  const conversationId = typeof formData.get("conversationId") === "string" ? String(formData.get("conversationId")) : "";
  const body = typeof formData.get("body") === "string" ? String(formData.get("body")).trim() : "";
  if (!UUID_PATTERN.test(conversationId) || !body || body.length > 2000) {
    redirect("/messages?status=invalid");
  }

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { data: conversation } = await db
    .from("conversations")
    .select("id,buyer_id,seller_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) {
    redirect("/messages?status=unavailable");
  }

  const otherUserId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;
  if (await hasBlockBetween(db, user.id, otherUserId)) redirect("/messages?status=blocked");

  const { error } = await db.from("messages").insert({
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
  if (!UUID_PATTERN.test(productId)) redirect("/messages?status=invalid");

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { data: product } = await db
    .from("products")
    .select("id,shop_id,status")
    .eq("id", productId)
    .eq("status", "active")
    .maybeSingle();
  if (!product?.shop_id) redirect("/messages?status=unavailable");

  const { data: shop } = await db
    .from("shops")
    .select("id,owner_id")
    .eq("id", product.shop_id)
    .maybeSingle();
  if (!shop?.owner_id) redirect("/messages?status=unavailable");
  if (shop.owner_id === user.id) redirect(`/produit/${productId}`);
  if (await hasBlockBetween(db, user.id, shop.owner_id)) redirect("/messages?status=blocked");

  const { data: existing } = await db
    .from("conversations")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("seller_id", shop.owner_id)
    .eq("shop_id", shop.id)
    .limit(1)
    .maybeSingle();
  if (existing?.id) redirect(`/messages/${existing.id}`);

  const { data: created, error } = await db
    .from("conversations")
    .insert({ buyer_id: user.id, seller_id: shop.owner_id, shop_id: shop.id })
    .select("id")
    .single();
  if (error || !created?.id) redirect("/messages?status=unavailable");
  revalidatePath("/messages");
  redirect(`/messages/${created.id}`);
}
