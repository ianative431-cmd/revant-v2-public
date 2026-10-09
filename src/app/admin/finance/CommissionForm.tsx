"use client";

import { useActionState } from "react";
import { updateCommissionPercent } from "@/server/admin/finance-actions";

export default function CommissionForm({ initialValue }: { initialValue: number }) {
  const [state, formAction, pending] = useActionState(updateCommissionPercent, { error: null });

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div>
        <label className="block text-[11px] text-white/40 mb-1" htmlFor="commissionPercent">
          Commission Revant (%)
        </label>
        <input
          id="commissionPercent"
          name="commissionPercent"
          type="number"
          step="0.01"
          min={0}
          max={100}
          defaultValue={initialValue}
          className="w-24 bg-[#0B0B10] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="bg-white text-[#0B0B10] rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "..." : "Enregistrer"}
      </button>
      {state.error && <p className="text-red-400 text-[11px] ml-2">{state.error}</p>}
    </form>
  );
}
