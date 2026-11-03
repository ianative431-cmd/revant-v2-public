"use client";

import { useActionState } from "react";
import {
  claimDelivery,
  confirmDeliveryCode,
  updateDeliveryStatus,
  type DeliveryActionState,
} from "@/server/delivery/actions";

const initialState: DeliveryActionState = { error: null };

export function ClaimDeliveryButton({ deliveryId }: { deliveryId: string }) {
  const [state, formAction, pending] = useActionState(claimDelivery, initialState);
  return <form action={formAction}>
    <input type="hidden" name="deliveryId" value={deliveryId} />
    <button type="submit" disabled={pending} className="rounded-full bg-[#0B0B10] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
      {pending ? "Attribution…" : "Prendre cette livraison"}
    </button>
    {state.error && <p role="alert" className="mt-2 text-xs text-red-700">{state.error}</p>}
  </form>;
}

export function DeliveryStepButton({ deliveryId, status }: { deliveryId: string; status: "picked_up" | "in_transit" | "failed" }) {
  const [state, formAction, pending] = useActionState(updateDeliveryStatus, initialState);
  const label = status === "picked_up" ? "Confirmer la récupération" : status === "in_transit" ? "Démarrer le trajet" : "Signaler un échec";
  return <form action={formAction}>
    <input type="hidden" name="deliveryId" value={deliveryId} />
    <input type="hidden" name="status" value={status} />
    <button type="submit" disabled={pending} className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold disabled:opacity-50">
      {pending ? "Mise à jour…" : label}
    </button>
    {state.error && <p role="alert" className="mt-2 text-xs text-red-700">{state.error}</p>}
  </form>;
}

export function DeliveryCodeForm({ deliveryId }: { deliveryId: string }) {
  const [state, formAction, pending] = useActionState(confirmDeliveryCode, initialState);
  return <form action={formAction} className="mt-3 space-y-2 rounded-xl bg-black/[0.03] p-3">
    <input type="hidden" name="deliveryId" value={deliveryId} />
    <label htmlFor={`delivery-code-${deliveryId}`} className="block text-xs font-semibold">Code donné par l’acheteur</label>
    <input id={`delivery-code-${deliveryId}`} name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}([0-9]{2})?" minLength={4} maxLength={6} required className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm tracking-[0.25em]" placeholder="4 ou 6 chiffres" />
    <button type="submit" disabled={pending} className="rounded-full bg-[#0B0B10] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
      {pending ? "Vérification…" : "Confirmer la remise"}
    </button>
    <p className="text-[11px] text-black/50">Ne confirme la remise qu’après avoir remis physiquement la commande à l’acheteur.</p>
    {state.error && <p role="alert" className="text-xs text-red-700">{state.error}</p>}
  </form>;
}
