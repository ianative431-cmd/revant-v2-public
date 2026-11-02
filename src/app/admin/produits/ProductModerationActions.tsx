"use client";

import { useActionState } from "react";
import { updateProductModeration, type AdminModerationState } from "@/server/admin/moderation-actions";

const initialState: AdminModerationState = { error: null };

export default function ProductModerationActions({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState(updateProductModeration, initialState);
  return (
    <form action={formAction} className="mt-3 grid gap-2 border-t border-black/5 pt-3">
      <input type="hidden" name="productId" value={productId} />
      <label className="grid gap-1 text-xs text-black/60">
        Décision
        <select name="nextStatus" defaultValue="active" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs">
          <option value="active">Approuver et publier</option>
          <option value="rejected">Refuser</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs text-black/60">
        Motif (obligatoire en cas de refus)
        <textarea name="reason" maxLength={500} rows={2} className="rounded-xl border border-black/10 px-3 py-2 text-xs" placeholder="Explique brièvement la décision…" />
      </label>
      <button type="submit" disabled={pending} className="w-fit rounded-full bg-black px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
        {pending ? "Traitement…" : "Appliquer la décision"}
      </button>
      {state.error && <p role="alert" className="text-xs text-red-700">{state.error}</p>}
      {state.warning && <p role="status" className="text-xs text-amber-700">{state.warning}</p>}
      {state.success && !state.warning && <p role="status" className="text-xs text-emerald-700">Décision enregistrée.</p>}
    </form>
  );
}
