"use client";

import { useActionState } from "react";
import { confirmOrder, cancelOrder, type OrderActionState } from "@/server/orders/actions";

const initialState: OrderActionState = { error: null };

export function ConfirmOrderButton({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(confirmOrder, initialState);
  return (
    <form action={formAction} onSubmit={(event) => {
      if (!confirm("Confirmer la prise en charge de cette commande ? Cela ne marque pas le paiement comme effectué.")) event.preventDefault();
    }}>
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" disabled={pending} className="rounded-full bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
        {pending ? "..." : "Confirmer la commande"}
      </button>
      {state.error && <p role="alert" className="mt-1 text-[10px] text-red-600">{state.error}</p>}
    </form>
  );
}

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(cancelOrder, initialState);
  return (
    <form action={formAction} onSubmit={(event) => {
      if (!confirm("Annuler cette commande et remettre le stock réservé en disponibilité ?")) event.preventDefault();
    }}>
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" disabled={pending} className="rounded-full border border-red-600 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50">
        {pending ? "..." : "Annuler"}
      </button>
      {state.error && <p role="alert" className="mt-1 text-[10px] text-red-600">{state.error}</p>}
    </form>
  );
}
