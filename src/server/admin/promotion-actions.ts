"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import type { Json } from "@/types/database";

export type PromotionActionState = { error: string | null; success?: boolean; warning?: string };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["pending", "rejected"],
  pending: ["active", "rejected"],
  active: ["paused", "completed"],
  paused: ["active", "completed"],
  completed: [],
  rejected: [],
};

export async function transitionPromotion(
  _previousState: PromotionActionState,
  formData: FormData
): Promise<PromotionActionState> {
  const actor = await requirePermission("catalog.manage");
  const promotionId = String(formData.get("promotionId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "");
  if (!UUID_PATTERN.test(promotionId)) return { error: "Référence de campagne invalide." };

  const admin = createSupabaseAdminClient();
  const { data: promotion, error: readError } = await admin
    .from("store_promotions")
    .select("id,status,budget,start_at,end_at")
    .eq("id", promotionId)
    .maybeSingle();
  if (readError || !promotion) return { error: "Campagne introuvable." };

  const allowed = TRANSITIONS[promotion.status] ?? [];
  if (!allowed.includes(nextStatus)) return { error: "Cette transition n’est pas autorisée pour cette campagne." };
  if (nextStatus === "active") {
    if (Number(promotion.budget) <= 0) return { error: "Une campagne doit avoir un budget positif avant activation." };
    if (!promotion.start_at) return { error: "Définis une date de début avant activation." };
    if (promotion.end_at && new Date(promotion.end_at).getTime() <= new Date(promotion.start_at).getTime()) {
      return { error: "La date de fin doit être postérieure à la date de début." };
    }
  }

  const { error: updateError } = await admin
    .from("store_promotions")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", promotionId)
    .eq("status", promotion.status);
  if (updateError) return { error: "Impossible de mettre à jour cette campagne." };

  const metadata: Json = { before: { status: promotion.status }, after: { status: nextStatus } };
  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "update",
    entity_type: "store_promotion",
    entity_id: promotionId,
    description: "Statut d’une campagne sponsorisée modifié",
    metadata,
  });

  revalidatePath("/admin/promotions");
  return {
    error: null,
    success: true,
    warning: auditError ? "Campagne mise à jour, mais l’entrée d’audit n’a pas pu être confirmée." : undefined,
  };
}
