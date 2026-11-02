"use client";

import { useActionState } from "react";
import {
  replyToSupportTicket,
  updateSupportTicket,
  type SupportActionState,
} from "@/server/admin/support-actions";

const initialState: SupportActionState = { error: null };

export default function SupportTicketActions({
  ticketId,
  status,
  priority,
}: {
  ticketId: string;
  status: string;
  priority: string;
}) {
  const [replyState, replyAction, replyPending] = useActionState(replyToSupportTicket, initialState);
  const [updateState, updateAction, updatePending] = useActionState(updateSupportTicket, initialState);
  const closed = status === "closed";

  return (
    <div className="mt-4 grid gap-4 border-t border-black/5 pt-4 md:grid-cols-2">
      <form action={replyAction} className="space-y-2">
        <input type="hidden" name="ticketId" value={ticketId} />
        <label htmlFor={`support-reply-${ticketId}`} className="block text-xs font-semibold text-black/60">Répondre au client</label>
        <textarea
          id={`support-reply-${ticketId}`}
          name="body"
          required
          minLength={1}
          maxLength={5000}
          rows={3}
          disabled={closed || replyPending}
          placeholder={closed ? "Réouvre le ticket pour répondre." : "Écris une réponse claire au client…"}
          className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm disabled:bg-black/[0.03]"
        />
        <button type="submit" disabled={closed || replyPending} className="rounded-full bg-[#0B0B10] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {replyPending ? "Envoi…" : "Envoyer la réponse"}
        </button>
        {replyState.error && <p role="alert" className="text-xs text-red-700">{replyState.error}</p>}
        {replyState.warning && <p role="status" className="text-xs text-amber-700">{replyState.warning}</p>}
        {replyState.success && !replyState.warning && <p role="status" className="text-xs text-emerald-700">Réponse envoyée.</p>}
      </form>

      <form action={updateAction} className="space-y-2">
        <input type="hidden" name="ticketId" value={ticketId} />
        <label className="block text-xs font-semibold text-black/60">Gestion du ticket</label>
        <div className="grid grid-cols-2 gap-2">
          <select name="status" defaultValue={status} className="min-w-0 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs">
            <option value="open">Ouvert</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Résolu</option>
            <option value="closed">Fermé</option>
          </select>
          <select name="priority" defaultValue={priority} className="min-w-0 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs">
            <option value="low">Faible</option>
            <option value="normal">Normale</option>
            <option value="high">Élevée</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
        <button type="submit" disabled={updatePending} className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold disabled:opacity-50">
          {updatePending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {updateState.error && <p role="alert" className="text-xs text-red-700">{updateState.error}</p>}
        {updateState.warning && <p role="status" className="text-xs text-amber-700">{updateState.warning}</p>}
        {updateState.success && !updateState.warning && <p role="status" className="text-xs text-emerald-700">Ticket mis à jour.</p>}
      </form>
    </div>
  );
}
