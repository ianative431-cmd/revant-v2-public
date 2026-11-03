"use client";

import { useActionState } from "react";
import { requestDeliveryForOrder, type DeliveryActionState } from "@/server/delivery/actions";

const initialState: DeliveryActionState = { error: null };

export default function RequestDeliveryButton({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(requestDeliveryForOrder, initialState);
  return <form action={formAction}>
    <input type="hidden" name="orderId" value={orderId} />
    <button type="submit" disabled={pending} className="rounded-full bg-[#803E2F] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
      {pending ? "Recherche…" : "Demander un livreur"}
    </button>
    {state.error && <p role="alert" className="mt-2 text-xs text-red-700">{state.error}</p>}
    {state.success && <p className="mt-2 text-xs text-green-700">Demande envoyée aux livreurs actifs.</p>}
  </form>;
}
