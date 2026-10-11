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
