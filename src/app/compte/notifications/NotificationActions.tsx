"use client";

import { useActionState } from "react";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationActionState,
} from "@/server/notifications/actions";

const initialState: NotificationActionState = { error: null };

export function MarkNotificationReadButton({ notificationId }: { notificationId: string }) {
  const [state, formAction, pending] = useActionState(markNotificationRead, initialState);
  return <form action={formAction}>
    <input type="hidden" name="notificationId" value={notificationId} />
    <button type="submit" disabled={pending} className="text-xs font-semibold underline text-brand-text/60 disabled:opacity-50">
      {pending ? "Mise à jour…" : "Marquer comme lue"}
    </button>
    {state.error && <p role="alert" className="mt-1 text-xs text-red-700">{state.error}</p>}
  </form>;
}

export function MarkAllNotificationsReadButton() {
  const [state, formAction, pending] = useActionState(markAllNotificationsRead, initialState);
  return <form action={formAction}>
    <button type="submit" disabled={pending} className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold disabled:opacity-50">
      {pending ? "Mise à jour…" : "Tout marquer comme lu"}
    </button>
    {state.error && <p role="alert" className="mt-1 text-xs text-red-700">{state.error}</p>}
  </form>;
}
