"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { requirePermission } from "@/server/auth/roles";
import { checkRateLimit, RATE_LIMIT_ERROR_MESSAGE } from "@/server/security/rate-limit";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SupportActionState = {
  error: string | null;
  success?: boolean;
  ticketId?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["open", "in_progress", "waiting_user", "resolved", "closed"]);
const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

function getSupportError(message: string, fallback: string): string {
  if (message.includes("ticket_not_found")) return "Ce dossier de support n’existe plus.";
  if (message.includes("ticket_closed")) return "Ce dossier est clôturé. Crée une nouvelle demande si le problème continue.";
  if (message.includes("ticket_assigned_to_other")) return "Ce dossier est déjà pris en charge par un autre agent.";
  if (message.includes("ticket_not_claimable")) return "Ce dossier est déjà résolu ou clôturé.";
  if (message.includes("invalid_message")) return "Le message doit contenir entre 1 et 5 000 caractères.";
  if (message.includes("forbidden")) return "Tu n’as pas l’autorisation d’effectuer cette action.";
  return fallback;
}

export async function createSupportTicketAction(
  _previousState: SupportActionState,
  formData: FormData
): Promise<SupportActionState> {
  const user = await requireUserWithLegalConsent();
  const subject = String(formData.get("subject") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (subject.length < 5 || subject.length > 160) {
    return { error: "Le sujet doit contenir entre 5 et 160 caractères." };
  }
  if (description.length < 10 || description.length > 3000) {
    return { error: "La description doit contenir entre 10 et 3 000 caractères." };
  }
  if (!(await checkRateLimit(`support:create:${user.id}`, 3, 60 * 60))) {
    return { error: RATE_LIMIT_ERROR_MESSAGE };
  }

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { data, error } = await db
    .from("support_tickets")
    .insert({ user_id: user.id, subject, description, status: "open", priority: "normal" })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("[support] ticket creation failed", error?.message);
    return { error: "La demande n’a pas pu être créée. Réessaie plus tard." };
  }

  revalidatePath("/compte/support");
  revalidatePath("/admin/support");
  return { error: null, success: true, ticketId: data.id };
}

export async function replySupportTicketAction(
  _previousState: SupportActionState,
  formData: FormData
): Promise<SupportActionState> {
  const user = await requireUserWithLegalConsent();
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!UUID_PATTERN.test(ticketId)) return { error: "Dossier de support invalide." };
  if (body.length < 1 || body.length > 5000) return { error: "Le message doit contenir entre 1 et 5 000 caractères." };
  if (!(await checkRateLimit(`support:reply:${user.id}`, 12, 60 * 60))) {
    return { error: RATE_LIMIT_ERROR_MESSAGE };
  }

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { error } = await db.rpc("reply_to_support_ticket", {
    p_ticket_id: ticketId,
    p_body: body,
  });

  if (error) return { error: getSupportError(error.message, "Le message n’a pas pu être envoyé.") };

  revalidatePath(`/compte/support/${ticketId}`);
  revalidatePath("/compte/support");
  revalidatePath("/admin/support");
  return { error: null, success: true };
}

export async function claimSupportTicketAction(
  _previousState: SupportActionState,
  formData: FormData
): Promise<SupportActionState> {
  await requirePermission("support.manage");
  const ticketId = String(formData.get("ticketId") ?? "");
  if (!UUID_PATTERN.test(ticketId)) return { error: "Dossier de support invalide." };

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { error } = await db.rpc("claim_support_ticket", { p_ticket_id: ticketId });
  if (error) return { error: getSupportError(error.message, "Impossible de prendre ce dossier en charge.") };

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
  return { error: null, success: true };
}

export async function staffReplySupportTicketAction(
  _previousState: SupportActionState,
  formData: FormData
): Promise<SupportActionState> {
  await requirePermission("support.manage");
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!UUID_PATTERN.test(ticketId)) return { error: "Dossier de support invalide." };
  if (body.length < 1 || body.length > 5000) return { error: "Le message doit contenir entre 1 et 5 000 caractères." };

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { error } = await db.rpc("staff_reply_to_support_ticket", {
    p_ticket_id: ticketId,
    p_body: body,
  });

  if (error) return { error: getSupportError(error.message, "La réponse n’a pas pu être envoyée.") };

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
  revalidatePath(`/compte/support/${ticketId}`);
  return { error: null, success: true };
}

export async function updateSupportTicketAction(
  _previousState: SupportActionState,
  formData: FormData
): Promise<SupportActionState> {
  await requirePermission("support.manage");
  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "");
  const priority = String(formData.get("priority") ?? "");

  if (!UUID_PATTERN.test(ticketId)) return { error: "Dossier de support invalide." };
  if (!STATUSES.has(status) || !PRIORITIES.has(priority)) {
    return { error: "Statut ou priorité invalide." };
  }

  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as SupabaseClient;
  const { error } = await db.rpc("update_support_ticket", {
    p_ticket_id: ticketId,
    p_status: status,
    p_priority: priority,
  });

  if (error) return { error: getSupportError(error.message, "La mise à jour du dossier a échoué.") };

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
  revalidatePath(`/compte/support/${ticketId}`);
  return { error: null, success: true };
}
