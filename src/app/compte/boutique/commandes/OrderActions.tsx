"use client";

import { useActionState } from "react";
import { confirmOrder, cancelOrder } from "@/server/orders/actions";

export function ConfirmOrderButton({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(confirmOrder, { error: null });
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Confirmer avoir reçu le paiement et livré cet article ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs bg-black text-white rounded-full px-3 py-1.5 font-medium disabled:opacity-50"
      >
        {pending ? "..." : "Confirmer (payé + livré)"}
      </button>
      {state.error && <p className="text-red-600 text-[10px] mt-1">{state.error}</p>}
    </form>
  );
}

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(cancelOrder, { error: null });
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Annuler cette commande ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs border border-red-600 text-red-600 rounded-full px-3 py-1.5 font-medium disabled:opacity-50"
      >
        {pending ? "..." : "Annuler"}
      </button>
      {state.error && <p className="text-red-600 text-[10px] mt-1">{state.error}</p>}
    </form>
  );
}
