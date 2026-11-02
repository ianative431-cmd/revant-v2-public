"use client";

import { useActionState } from "react";
import { submitProductForReview, type SubmitProductState } from "@/server/products/actions";

const initialState: SubmitProductState = { error: null };

export default function SubmitProductButton({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState(submitProductForReview, initialState);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="productId" value={productId} />
      <button type="submit" disabled={pending} className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
        {pending ? "Envoi…" : "Soumettre à validation"}
      </button>
      {state.error && <p role="alert" className="w-full text-[11px] text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="w-full text-[11px] text-emerald-700">Annonce envoyée à l’équipe Revant.</p>}
    </form>
  );
}
