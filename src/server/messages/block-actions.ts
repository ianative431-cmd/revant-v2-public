"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function blockUserFromConversation(formData: FormData): Promise<never> {
  const user = await requireUserWithLegalConsent();
  const conversationId = String(formData.get("conversationId") ?? "").trim();
  if (!UUID_PATTERN.test(conversationId)) redirect("/messages?status=invalid");

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { data: conversation } = await db
    .from("conversations")
    .select("buyer_id,seller_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) {
    redirect("/messages?status=unavailable");
  }

  const blockedId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;
  if (!blockedId || blockedId === user.id) redirect("/messages?status=invalid");

  const { error } = await db.from("user_blocks").upsert({
    blocker_id: user.id,
    blocked_id: blockedId,
  }, { onConflict: "blocker_id,blocked_id" });

  if (error) redirect(`/messages/${conversationId}?status=error`);
  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/compte/blocages");
  redirect("/messages?status=blocked");
}

export async function unblockUser(formData: FormData): Promise<void> {
  const user = await requireUserWithLegalConsent();
  const blockedId = String(formData.get("blockedId") ?? "").trim();
  if (!UUID_PATTERN.test(blockedId) || blockedId === user.id) return;

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { error } = await db
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);

  if (error) throw new Error("Impossible de débloquer ce compte.");
  revalidatePath("/compte/blocages");
  revalidatePath("/messages");
}
