"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/server/auth/roles";
import type { Json } from "@/types/database";

export type SupportActionState = {
  error: string | null;
  success?: boolean;
  warning?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["open", "in_progress", "resolved", "closed"]);
const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

async function writeSupportAudit(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  actorId: string,
  ticketId: string,
  description: string,
  metadata: Json
) {
  const { error } = await admin.from("audit_logs").insert({
    actor_id: actorId,
    action: "update",
    entity_type: "support_ticket",
    entity_id: ticketId,
    description,
    metadata,
  });
  return !error;
}

export async function replyToSupportTicket(
  _previousState: SupportActionState,
  formData: FormData
): Promise<SupportActionState> {
  const actor = await requirePermission("support.manage");
  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!UUID_PATTERN.test(ticketId)) return { error: "Référence du ticket invalide." };
  if (body.length < 1 || body.length > 5000) return { error: "La réponse doit contenir entre 1 et 5 000 caractères." };

  const admin = createSupabaseAdminClient();
  const { data: ticket, error: ticketError } = await admin
    .from("support_tickets")
    .select("id,status")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError || !ticket) return { error: "Ticket introuvable ou inaccessible." };
  if (ticket.status === "closed") return { error: "Ce ticket est fermé. Réouvre-le avant de répondre." };

  const { error: messageError } = await admin.from("support_messages").insert({
    ticket_id: ticketId,
    sender_id: actor.id,
    body,
  });
  if (messageError) return { error: "La réponse n’a pas pu être envoyée. Réessaie." };

  if (ticket.status === "open") {
    const { error: statusError } = await admin
      .from("support_tickets")
      .update({ status: "in_progress", assigned_to: actor.id, updated_at: new Date().toISOString() })
      .eq("id", ticketId);
    if (statusError) {
      revalidatePath("/admin/messages");
      return { error: "Réponse envoyée, mais le ticket n’a pas pu passer en cours de traitement. Ne renvoie pas le message." };
    }
  }

  const audited = await writeSupportAudit(
    admin,
    actor.id,
    ticketId,
    "Réponse envoyée au ticket support",
    { operation: "reply", message_length: body.length, previous_status: ticket.status }
  );

  revalidatePath("/admin/messages");
  return {
    error: null,
    success: true,
    warning: audited ? undefined : "Réponse envoyée, mais son entrée d’audit n’a pas pu être confirmée.",
  };
}

export async function updateSupportTicket(
  _previousState: SupportActionState,
  formData: FormData
): Promise<SupportActionState> {
  const actor = await requirePermission("support.manage");
  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const priority = String(formData.get("priority") ?? "");

  if (!UUID_PATTERN.test(ticketId)) return { error: "Référence du ticket invalide." };
  if (!STATUSES.has(status) || !PRIORITIES.has(priority)) return { error: "Statut ou priorité invalide." };

  const admin = createSupabaseAdminClient();
  const { data: ticket, error: ticketError } = await admin
    .from("support_tickets")
    .select("id,status,priority,assigned_to")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError || !ticket) return { error: "Ticket introuvable ou inaccessible." };

  const assignedTo = status === "in_progress" ? (ticket.assigned_to ?? actor.id) : ticket.assigned_to;
  const { error: updateError } = await admin
    .from("support_tickets")
    .update({ status, priority, assigned_to: assignedTo, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (updateError) return { error: "Impossible d’enregistrer les changements du ticket." };

  const audited = await writeSupportAudit(
    admin,
    actor.id,
    ticketId,
    "Statut ou priorité du ticket support modifié",
    {
      operation: "update",
      before: { status: ticket.status, priority: ticket.priority, assigned_to: ticket.assigned_to },
      after: { status, priority, assigned_to: assignedTo },
    }
  );

  revalidatePath("/admin/messages");
  return {
    error: null,
    success: true,
    warning: audited ? undefined : "Modifications enregistrées, mais leur entrée d’audit n’a pas pu être confirmée.",
  };
}
