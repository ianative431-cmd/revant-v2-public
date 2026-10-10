"use client";

import { useActionState } from "react";
import { createGuestOrder, type GuestOrderState } from "@/server/orders/guest-actions";

const initialState: GuestOrderState = { error: null };

export default function GuestOrderForm({ productId, price, currency }: {
  productId: string;
  price: number;
  currency: string;
}) {
  const [state, formAction, pending] = useActionState(createGuestOrder, initialState);

  if (state.success) {
    return (
      <div className="mt-4 rounded-2xl border border-brand-accent/30 bg-white p-4">
        <p className="text-sm font-semibold">Commande enregistrée sans compte</p>
        <p className="mt-2 text-sm">Numéro de commande : <strong>{state.orderNumber}</strong></p>
        <p className="mt-1 text-sm">Montant : {(state.totalAmount ?? price).toLocaleString("fr-FR")} {currency}</p>
        <p className="mt-2 text-xs text-brand-text/70">La boutique te contactera au numéro indiqué pour confirmer la livraison et le paiement. Garde ce numéro de commande.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 rounded-2xl bg-white p-4 flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">Commander sans compte</h2>
        <p className="mt-1 text-xs text-brand-text/60">Pas besoin de t'inscrire ni de te connecter.</p>
      </div>
      <input type="hidden" name="productId" value={productId} />
      <label className="text-xs font-medium">Nom complet
        <input name="guestName" autoComplete="name" required minLength={2} maxLength={120} className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" placeholder="Ton nom complet" />
      </label>
      <label className="text-xs font-medium">Téléphone
        <input name="guestPhone" type="tel" autoComplete="tel" required minLength={8} maxLength={24} className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" placeholder="+227 ..." />
      </label>
      <label className="text-xs font-medium">Ville
        <input name="guestCity" autoComplete="address-level2" required minLength={2} maxLength={120} className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" placeholder="Niamey..." />
      </label>
      <label className="text-xs font-medium">Adresse de livraison
        <textarea name="guestAddress" autoComplete="street-address" required minLength={4} maxLength={240} rows={2} className="mt-1 w-full rounded-xl border px-3 py-3 text-sm resize-none" placeholder="Quartier, rue, repère..." />
      </label>
      <p className="text-xs text-brand-text/70">Total actuel : {price.toLocaleString("fr-FR")} {currency}. Aucun paiement en ligne n'est effectué à cette étape.</p>
      {state.error && <p role="alert" className="text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-full bg-brand-accent py-3 text-sm font-medium text-white disabled:opacity-50">
        {pending ? "Enregistrement..." : "Confirmer la commande"}
      </button>
    </form>
  );
}
