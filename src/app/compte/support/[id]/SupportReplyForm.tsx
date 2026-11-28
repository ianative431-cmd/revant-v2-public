"use client";

import { useActionState } from "react";
import { replySupportTicketAction, type SupportActionState } from "@/server/support/actions";

const INITIAL_STATE: SupportActionState = { error: null };

export default function SupportReplyForm({ ticketId }: { ticketId: string }) {
  const [state, formAction, pending] = useActionState(replySupportTicketAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
      <input type="hidden" name="ticketId" value={ticketId} />
      <label className="block text-sm font-semibold text-[var(--brand-text)]">
        Ajouter une réponse
        <textarea
          name="body"
          required
          maxLength={5000}
          rows={4}
          placeholder="Écris ton message à l’équipe Revant…"
          className="mt-2 w-full resize-y rounded-xl border border-[var(--brand-border)] bg-white px-3 py-3 text-sm font-normal outline-none focus:border-brand-accent"
        />
      </label>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="text-sm text-emerald-700">Réponse envoyée. Le dossier est de nouveau ouvert.</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-brand-accent px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
        {pending ? "Envoi…" : "Envoyer la réponse"}
      </button>
    </form>
  );
}
