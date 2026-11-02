"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateReportAction(formData: FormData): Promise<void> {
  await requirePermission("support.manage");
  const reportId = String(formData.get("reportId") ?? "");
  const action = String(formData.get("action") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!UUID_RE.test(reportId) || !["review", "resolve", "dismiss"].includes(action)) throw new Error("Demande de modération invalide.");
  if ((action === "resolve" || action === "dismiss") && (note.length < 5 || note.length > 500)) throw new Error("Le motif doit contenir entre 5 et 500 caractères.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_update_report", { p_report_id: reportId, p_action: action, p_note: note || null });
  if (error) throw new Error("Impossible d'enregistrer la décision sur ce signalement.");
  revalidatePath("/admin/avis");
}

export async function moderateReviewAction(formData: FormData): Promise<void> {
  await requirePermission("support.manage");
  const reviewId = String(formData.get("reviewId") ?? "");
  const publishRaw = String(formData.get("publish") ?? "");
  if (!UUID_RE.test(reviewId) || !["true", "false"].includes(publishRaw)) throw new Error("Demande de modération invalide.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_moderate_review", {
    p_review_id: reviewId,
    p_publish: publishRaw === "true",
    p_note: "Décision depuis la rubrique Avis et signalements",
  });
  if (error) throw new Error("Impossible de modifier la visibilité de cet avis.");
  revalidatePath("/admin/avis");
}
