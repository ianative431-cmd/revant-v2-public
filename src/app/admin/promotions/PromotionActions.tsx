"use client";

import { useActionState } from "react";
import { transitionPromotion, type PromotionActionState } from "@/server/admin/promotion-actions";

const initialState: PromotionActionState = { error: null };
const NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
  draft: [{ value: "pending", label: "Soumettre pour validation" }, { value: "rejected", label: "Refuser" }],
  pending: [{ value: "active", label: "Activer" }, { value: "rejected", label: "Refuser" }],
  active: [{ value: "paused", label: "Mettre en pause" }, { value: "completed", label: "Terminer" }],
  paused: [{ value: "active", label: "Reprendre" }, { value: "completed", label: "Terminer" }],
  completed: [],
  rejected: [],
};

export default function PromotionActions({ promotionId, status }: { promotionId: string; status: string }) {
  const [state, action, pending] = useActionState(transitionPromotion, initialState);
  const options = NEXT_STATUS[status] ?? [];
  if (options.length === 0) return <p className="mt-3 text-xs text-black/40">Campagne terminée : aucune action disponible.</p>;

  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3">
      <input type="hidden" name="promotionId" value={promotionId} />
      <label htmlFor={`promotion-status-${promotionId}`} className="text-xs text-black/50">Action</label>
      <select id={`promotion-status-${promotionId}`} name="nextStatus" defaultValue={options[0].value} className="min-w-0 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <button type="submit" disabled={pending} className="rounded-full bg-[#0B0B10] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
        {pending ? "Enregistrement…" : "Appliquer"}
      </button>
      {state.error && <p role="alert" className="w-full text-xs text-red-700">{state.error}</p>}
      {state.warning && <p role="status" className="w-full text-xs text-amber-700">{state.warning}</p>}
      {state.success && !state.warning && <p role="status" className="w-full text-xs text-emerald-700">Campagne mise à jour.</p>}
    </form>
  );
}
