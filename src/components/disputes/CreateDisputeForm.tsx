"use client";

import { useActionState } from "react";
import { createDisputeAction, type CreateDisputeState } from "@/server/disputes/actions";

const initialState: CreateDisputeState = { error: null };

export default function CreateDisputeForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(createDisputeAction, initialState);
  if (state.success) return <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">Ton dossier a été transmis au support Revant. Tu pourras suivre son traitement depuis cette commande.</p>;
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor={"dispute-reason-" + orderId} className="block text-xs font-bold">Motif du litige</label>
        <input id={"dispute-reason-" + orderId} name="reason" required minLength={3} maxLength={120} className="mt-1 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3 text-sm" placeholder="Ex. Article non conforme" />
      </div>
      <div>
        <label htmlFor={"dispute-description-" + orderId} className="block text-xs font-bold">Explique la situation</label>
        <textarea id={"dispute-description-" + orderId} name="description" required minLength={10} maxLength={3000} rows={4} className="mt-1 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3 text-sm" placeholder="Décris les faits, les échanges et ce que tu demandes au support…" />
      </div>
      {state.error && <p role="alert" className="text-xs text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-[var(--brand-accent)] px-5 py-3 text-xs font-bold text-[var(--brand-accent-contrast)] disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Transmission…" : "Ouvrir un litige"}</button>
      <p className="text-[10px] leading-relaxed text-[var(--brand-muted)]">Un seul dossier peut être ouvert par commande. Les informations transmises seront accessibles aux personnes autorisées au traitement du litige.</p>
    </form>
  );
}