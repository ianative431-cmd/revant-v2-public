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
      <button type="submit" disabled={pending} className="rounded-full bg-[var(--brand-accent)] px-4 py-2.5 text-xs font-bold text-[var(--brand-accent-contrast)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] disabled:cursor-not-allowed disabled:opacity-50">
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
      <button type="submit" disabled={pending} className="rounded-full border border-red-600/50 bg-[var(--brand-surface)] px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50">
        {pending ? "..." : "Annuler"}
      </button>
      {state.error && <p role="alert" className="mt-1 text-[10px] text-red-600">{state.error}</p>}
    </form>
  );
}
