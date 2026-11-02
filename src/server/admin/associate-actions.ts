"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/server/auth/roles";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function setAssociateRoleAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();
  const userId = String(formData.get("userId") ?? "");
  const enabledRaw = String(formData.get("enabled") ?? "");
  if (!UUID_RE.test(userId) || !["true", "false"].includes(enabledRaw)) {
    throw new Error("Demande de changement de rôle invalide.");
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_set_associate_role", {
    p_user_id: userId,
    p_enabled: enabledRaw === "true",
    p_note: "Gestion du rôle associé depuis l'annuaire super-admin",
  });
  if (error) throw new Error("Impossible de modifier le rôle associé.");
  revalidatePath("/admin/utilisateurs");
}
