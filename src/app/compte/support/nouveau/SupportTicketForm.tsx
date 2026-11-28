"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createSupportTicketAction, type SupportActionState } from "@/server/support/actions";

const INITIAL_STATE: SupportActionState = { error: null };

export default function SupportTicketForm() {
  const [state, formAction, pending] = useActionState(createSupportTicketAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
      <label className="block text-sm font-semibold text-[var(--brand-text)]">
        Sujet
        <input
          name="subject"
          required
          minLength={5}
          maxLength={160}
          placeholder="Ex. : problème avec ma commande"
          className="mt-2 w-full rounded-xl border border-[var(--brand-border)] bg-white px-3 py-3 text-sm font-normal outline-none focus:border-brand-accent"
        />
      </label>
      <label className="block text-sm font-semibold text-[var(--brand-text)]">
        Explique le problème
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={3000}
          rows={6}
          placeholder="Décris ce qui s’est passé et ce que tu attends de l’équipe Revant."
          className="mt-2 w-full resize-y rounded-xl border border-[var(--brand-border)] bg-white px-3 py-3 text-sm font-normal outline-none focus:border-brand-accent"
        />
      </label>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state.success && state.ticketId && (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Demande créée. <Link className="font-semibold underline" href={`/compte/support/${state.ticketId}`}>Ouvrir le dossier</Link>
        </p>
      )}
      <button type="submit" disabled={pending} className="w-full rounded-full bg-brand-accent px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
        {pending ? "Envoi…" : "Envoyer à l’assistance"}
      </button>
    </form>
  );
}
