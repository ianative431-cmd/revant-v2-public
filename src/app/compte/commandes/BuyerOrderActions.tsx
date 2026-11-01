"use client";

import { useActionState } from "react";
import { cancelBuyerOrder, type OrderActionState } from "@/server/orders/actions";

const initialState: OrderActionState = { error: null };

export default function BuyerOrderActions({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(cancelBuyerOrder, initialState);
  return (
    <form action={formAction} onSubmit={(event) => {
      if (!confirm("Annuler cette commande ? Cette action est possible uniquement avant confirmation du vendeur.")) event.preventDefault();
    }}>
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" disabled={pending} className="rounded-full border border-red-600 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50">
        {pending ? "..." : "Annuler la commande"}
      </button>
      {state.error && <p role="alert" className="mt-1 text-[10px] text-red-600">{state.error}</p>}
    </form>
  );
}
