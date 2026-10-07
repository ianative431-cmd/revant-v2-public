"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FinanceActionState = { error: string | null };

/**
 * Approuve ou rejette un retrait vendeur. Délègue au RPC
 * admin_update_payout (SECURITY DEFINER) : c'est LUI qui revérifie le
 * rôle admin, que le retrait est bien "pending", et qui écrit la
 * trace dans admin_actions + audit_logs — rien de tout ça n'est
 * recalculé ni dupliqué ici.
 */
export async function updatePayoutStatus(
  _prevState: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  await requireAdmin();

  const payoutId = String(formData.get("payoutId") ?? "");
  const action = String(formData.get("action") ?? "");

  if (action !== "approve" && action !== "reject") {
    return { error: "Action invalide." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_update_payout", {
    p_payout_id: payoutId,
    p_action: action,
    p_reason: action === "reject" ? "Rejeté depuis l'espace finance" : undefined,
  });

  if (error) {
    return { error: `Impossible de mettre à jour ce retrait : ${error.message}` };
  }

  revalidatePath("/admin/finance");
  return { error: null };
}

/**
 * Modifie la commission Revant. Délègue au RPC admin_set_setting
 * (SECURITY DEFINER) : c'est lui qui vérifie le type de valeur, la
 * borne 0-100, et qui écrit l'entrée dans audit_logs.
 */
export async function updateCommissionPercent(
  _prevState: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const admin = await requireAdmin();

  const raw = String(formData.get("commissionPercent") ?? "");
  const value = Number(raw.replace(",", "."));

  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return { error: "La commission doit être un nombre entre 0 et 100." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_set_setting", {
    p_key: "revant.commission_percent",
    p_value: value,
    p_actor: admin.id,
  });

  if (error) {
    return { error: `Impossible de modifier la commission : ${error.message}` };
  }

  revalidatePath("/admin/finance");
  return { error: null };
}
