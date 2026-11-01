"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/server/auth/roles";

export type ReportActionState = { error: string | null };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateAdminReport(
  _previousState: ReportActionState,
  formData: FormData
): Promise<ReportActionState> {
  await requirePermission("support.manage");
  const reportId = String(formData.get("reportId") ?? "").trim();
  const action = String(formData.get("action") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (!UUID_PATTERN.test(reportId)) return { error: "Signalement invalide." };
  if (action !== "review" && action !== "resolve" && action !== "dismiss") return { error: "Action invalide." };
  if (action !== "review" && note.length < 3) return { error: "Ajoute une note courte pour clôturer ce signalement." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_update_report", {
    p_report_id: reportId,
    p_action: action,
    p_note: note || null,
  });
  if (error) return { error: "Impossible de mettre à jour le signalement. Vérifie son statut et réessaie." };

  revalidatePath("/admin/avis");
  return { error: null };
}
