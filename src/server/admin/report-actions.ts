"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REPORT_STATUSES = new Set(["open", "reviewing", "resolved", "dismissed"]);

export async function updateReportStatus(formData: FormData): Promise<void> {
  const user = await requirePermission("products.manage");
  const reportId = String(formData.get("reportId") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const resolutionNote = String(formData.get("resolutionNote") ?? "").trim().slice(0, 1000);

  if (!UUID_PATTERN.test(reportId) || !REPORT_STATUSES.has(status)) return;

  const admin = createSupabaseAdminClient() as unknown as SupabaseClient;
  const isClosed = status === "resolved" || status === "dismissed";
  const { error } = await admin.from("reports").update({
    status,
    assigned_to: user.id,
    resolution_note: resolutionNote || null,
    resolved_at: isClosed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", reportId);

  if (error) throw new Error("Impossible de mettre à jour le signalement.");
  revalidatePath("/admin/signalements");
}
