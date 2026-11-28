"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { checkRateLimit, RATE_LIMIT_ERROR_MESSAGE } from "@/server/security/rate-limit";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportActionState = {
  error: string | null;
  success?: boolean;
};

const ALLOWED_TARGETS = new Set(["user", "shop", "product", "review", "message", "order"]);
const ALLOWED_REASONS = new Set(["spam", "fraud", "counterfeit", "inappropriate", "harassment", "misleading", "other"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function validateReportTarget(
  db: SupabaseClient,
  userId: string,
  targetType: string,
  targetId: string
): Promise<string | null> {
  if (targetType === "user") {
    if (targetId === userId) return "Tu ne peux pas signaler ton propre compte.";
    const { data, error } = await db.from("profiles").select("id").eq("id", targetId).maybeSingle();
    if (error || !data) return "Ce compte n’est plus disponible.";
    return null;
  }

  if (targetType === "shop") {
    const { data: shop, error } = await db.from("shops").select("owner_id").eq("id", targetId).maybeSingle();
    if (error || !shop) return "Cette boutique n’existe plus.";
    if (shop.owner_id === userId) return "Tu ne peux pas signaler ta propre boutique.";
    return null;
  }

  if (targetType === "product") {
    const { data: product, error: productError } = await db.from("products").select("shop_id").eq("id", targetId).maybeSingle();
    if (productError || !product?.shop_id) return "Ce produit n’existe plus.";
    const { data: shop, error: shopError } = await db.from("shops").select("owner_id").eq("id", product.shop_id).maybeSingle();
    if (shopError || !shop) return "La boutique associée à ce produit n’est plus disponible.";
    if (shop.owner_id === userId) return "Tu ne peux pas signaler ta propre annonce.";
    return null;
  }

  if (targetType === "review") {
    const { data: review, error } = await db
      .from("reviews")
      .select("user_id,is_published")
      .eq("id", targetId)
      .maybeSingle();
    if (error || !review || !review.is_published) return "Cet avis n’est plus disponible.";
    if (review.user_id === userId) return "Tu ne peux pas signaler ton propre avis.";
    return null;
  }

  if (targetType === "message") {
    const { data: message, error: messageError } = await db
      .from("messages")
      .select("sender_id,conversation_id")
      .eq("id", targetId)
      .maybeSingle();
    if (messageError || !message) return "Ce message n’est plus disponible.";
    if (message.sender_id === userId) return "Tu ne peux pas signaler ton propre message.";

    const { data: conversation, error: conversationError } = await db
      .from("conversations")
      .select("buyer_id,seller_id")
      .eq("id", message.conversation_id)
      .maybeSingle();
    if (conversationError || !conversation) return "Cette conversation n’est plus disponible.";
    if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
      return "Tu ne peux signaler que les messages d’une conversation à laquelle tu participes.";
    }
    return null;
  }

  if (targetType === "order") {
    const { data: order, error: orderError } = await db
      .from("orders")
      .select("buyer_id")
      .eq("id", targetId)
      .maybeSingle();
    if (orderError || !order) return "Cette commande n’est plus disponible.";
    if (order.buyer_id === userId) return null;

    const { data: items, error: itemsError } = await db
      .from("order_items")
      .select("shop_id")
      .eq("order_id", targetId)
      .limit(20);
    if (itemsError || !items?.length) return "Impossible de vérifier les participants de cette commande.";

    const shopIds = [...new Set(items.map((item) => item.shop_id).filter(Boolean))];
    if (shopIds.length === 0) return "Cette commande n’a plus de boutique associée.";

    const { data: shops, error: shopsError } = await db
      .from("shops")
      .select("owner_id")
      .in("id", shopIds);
    if (shopsError) return "Impossible de vérifier les participants de cette commande.";
    if ((shops ?? []).some((shop) => shop.owner_id === userId)) return null;

    return "Tu ne peux signaler qu’une commande à laquelle tu as participé.";
  }

  return "Élément à signaler invalide.";
}

export async function submitContentReport(
  _previousState: ReportActionState,
  formData: FormData
): Promise<ReportActionState> {
  const user = await requireUserWithLegalConsent();
  const target = String(formData.get("target") ?? "");
  const separator = target.indexOf(":");
  const targetType = separator > 0 ? target.slice(0, separator) : "";
  const targetId = separator > 0 ? target.slice(separator + 1) : "";
  const reason = String(formData.get("reason") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (!ALLOWED_TARGETS.has(targetType) || !UUID_PATTERN.test(targetId)) {
    return { error: "Élément à signaler invalide." };
  }
  if (!ALLOWED_REASONS.has(reason)) {
    return { error: "Choisis un motif de signalement valide." };
  }
  if (description.length > 1000) {
    return { error: "Les détails ne doivent pas dépasser 1 000 caractères." };
  }

  if (!(await checkRateLimit(`report:account:${user.id}`, 5, 60 * 60))) {
    return { error: RATE_LIMIT_ERROR_MESSAGE };
  }

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;

  const targetError = await validateReportTarget(db, user.id, targetType, targetId);
  if (targetError) return { error: targetError };

  const { data: existing, error: existingError } = await db
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .in("status", ["open", "reviewing"])
    .maybeSingle();

  if (existingError) return { error: "Impossible de vérifier les signalements déjà ouverts." };
  if (existing) return { error: "Tu as déjà un signalement en cours pour cet élément." };

  const { error } = await db.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    description: description || null,
  });

  if (error?.code === "23505") {
    return { error: "Tu as déjà un signalement en cours pour cet élément." };
  }
  if (error) return { error: "Le signalement n’a pas pu être envoyé. Réessaie plus tard." };
  return { error: null, success: true };
}
