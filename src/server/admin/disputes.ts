"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(["review", "buyer", "seller", "reject", "close"]);

export async function updateDisputeAction(formData: FormData): Promise<void> {
  await requirePermission("support.manage");

  const disputeId = String(formData.get("disputeId") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!UUID_RE.test(disputeId) || !ACTIONS.has(action)) {
    throw new Error("Demande de traitement du litige invalide.");
  }

  if (note.length > 1000 || (action !== "review" && note.length < 10)) {
    throw new Error("Une note de décision de 10 à 1 000 caractères est obligatoire.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_update_dispute", {
    p_dispute_id: disputeId,
    p_action: action,
    p_note: note || undefined,
  });

  if (error) {
    if (error.message.includes("dispute_assigned_to_another_agent") ||
        error.message.includes("dispute_must_be_claimed_before_decision")) {
      throw new Error("Ce litige doit d’abord être attribué à votre compte ou repris par un administrateur habilité.");
    }
    if (error.message.includes("resolution_note_required")) {
      throw new Error("Ajoutez une note de décision d’au moins 10 caractères.");
    }
    if (error.message.includes("invalid_dispute_transition")) {
      throw new Error("Cette transition n’est plus autorisée pour l’état actuel du litige.");
    }
    if (error.message.includes("dispute_not_found")) {
      throw new Error("Ce litige n’existe plus.");
    }
    throw new Error("Impossible d’enregistrer la décision sur ce litige.");
  }

  revalidatePath("/admin/litiges");
}
