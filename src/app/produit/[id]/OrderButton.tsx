"use client";

import { useActionState } from "react";
import { createOrder } from "@/server/orders/actions";

export default function OrderButton({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState(createOrder, { error: null });

  if (state.success) {
    return (
      <div className="border border-black rounded-2xl py-3 px-4 text-center">
        <p className="text-sm font-medium">Commande envoyée</p>
        <p className="text-xs text-black/60 mt-1">
          En attente de confirmation du vendeur (paiement à régler directement avec lui).
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "..." : "Commander"}
      </button>
      {state.error && <p className="text-red-600 text-xs mt-2 text-center">{state.error}</p>}
    </form>
  );
}
