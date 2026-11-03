"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";

export type NotificationActionState = { error: string | null; success?: boolean };

type NotificationRpc = {
  rpc: (name: string, args?: { p_notification_id?: string }) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function markNotificationRead(
  _previousState: NotificationActionState,
  formData: FormData
): Promise<NotificationActionState> {
  await requireUserWithLegalConsent();
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  if (!UUID_PATTERN.test(notificationId)) return { error: "Notification invalide." };
  const supabase = await createSupabaseServerClient();
  const rpc = supabase as unknown as NotificationRpc;
  const { data, error } = await rpc.rpc("mark_notification_read", { p_notification_id: notificationId });
  if (error || data !== true) return { error: "Impossible de marquer cette notification comme lue." };
  revalidatePath("/compte/notifications");
  return { error: null, success: true };
}

export async function markAllNotificationsRead(
  _previousState: NotificationActionState,
  _formData: FormData
): Promise<NotificationActionState> {
  await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();
  const rpc = supabase as unknown as NotificationRpc;
  const { error } = await rpc.rpc("mark_all_notifications_read");
  if (error) return { error: "Impossible de mettre à jour les notifications." };
  revalidatePath("/compte/notifications");
  return { error: null, success: true };
}
