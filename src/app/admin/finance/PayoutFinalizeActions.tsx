"use client";

import { useActionState } from "react";
import { finalizePayout } from "@/server/admin/finance-actions";

export default function PayoutFinalizeActions({ payoutId }: { payoutId: string }) {
  const [state, formAction, pending] = useActionState(finalizePayout, { error: null });

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <form
        action={formAction}
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          if (!confirm("Confirmer que le transfert externe a déjà été réellement exécuté ?")) event.preventDefault();
        }}
      >
        <input type="hidden" name="payoutId" value={payoutId} />
        <input type="hidden" name="action" value="paid" />
        <input
          name="transferReference"
          required
          minLength={4}
          maxLength={128}
          placeholder="Référence du virement"
          className="min-w-0 rounded-lg border border-white/10 bg-[#171013] px-2 py-1.5 text-[11px] text-white placeholder:text-white/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-50"
        >
          {pending ? "..." : "Confirmer payé"}
        </button>
      </form>
      <form
        action={formAction}
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          if (!confirm("Enregistrer l'échec et restituer les fonds au vendeur ?")) event.preventDefault();
        }}
      >
        <input type="hidden" name="payoutId" value={payoutId} />
        <input type="hidden" name="action" value="failed" />
        <input
          name="reason"
          required
          minLength={5}
          maxLength={500}
          placeholder="Motif d'échec du transfert"
          className="min-w-0 rounded-lg border border-white/10 bg-[#171013] px-2 py-1.5 text-[11px] text-white placeholder:text-white/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-red-500/40 px-3 py-1.5 text-[11px] font-medium text-red-300 disabled:opacity-50"
        >
          {pending ? "..." : "Marquer échec"}
        </button>
      </form>
      {state.error && <p className="text-[10px] text-red-400">{state.error}</p>}
    </div>
  );
}
