"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportActionState = {
  error: string | null;
  success?: boolean;
};

const ALLOWED_TARGETS = new Set(["user", "shop", "product", "review", "message", "order"]);
const ALLOWED_REASONS = new Set(["spam", "fraud", "counterfeit", "inappropriate", "harassment", "misleading", "other"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const description = String(formData.get("description") ?? "").trim().slice(0, 1000);

  if (!ALLOWED_TARGETS.has(targetType) || !UUID_PATTERN.test(targetId)) {
    return { error: "Élément à signaler invalide." };
  }
  if (!ALLOWED_REASONS.has(reason)) {
    return { error: "Choisis un motif de signalement valide." };
  }
  if (targetType === "user" && targetId === user.id) {
    return { error: "Tu ne peux pas signaler ton propre compte." };
  }

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;

  if (targetType === "product") {
    const { data: product } = await db.from("products").select("shop_id").eq("id", targetId).maybeSingle();
    if (!product?.shop_id) return { error: "Ce produit n’existe plus." };
    const { data: shop } = await db.from("shops").select("owner_id").eq("id", product.shop_id).maybeSingle();
    if (shop?.owner_id === user.id) return { error: "Tu ne peux pas signaler ta propre annonce." };
  } else if (targetType === "shop") {
    const { data: shop } = await db.from("shops").select("owner_id").eq("id", targetId).maybeSingle();
    if (!shop) return { error: "Cette boutique n’existe plus." };
    if (shop.owner_id === user.id) return { error: "Tu ne peux pas signaler ta propre boutique." };
  }

  const { data: existing } = await db
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "open")
    .maybeSingle();

  if (existing) return { error: "Tu as déjà un signalement ouvert pour cet élément." };

  const { error } = await db.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    description: description || null,
  });

  if (error) {
    return { error: "Le signalement n’a pas pu être envoyé. Réessaie plus tard." };
  }
  return { error: null, success: true };
}
