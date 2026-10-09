"use client";

import { useActionState } from "react";
import { updatePayoutStatus } from "@/server/admin/finance-actions";

export default function PayoutActions({ payoutId }: { payoutId: string }) {
  const [state, formAction, pending] = useActionState(updatePayoutStatus, { error: null });

  return (
    <div>
      <div className="flex gap-2">
        <form action={formAction}>
          <input type="hidden" name="payoutId" value={payoutId} />
          <input type="hidden" name="action" value="approve" />
          <button
            type="submit"
            disabled={pending}
            className="text-xs bg-white text-[#0B0B10] rounded-full px-3 py-1.5 font-medium disabled:opacity-50"
          >
            {pending ? "..." : "Approuver"}
          </button>
        </form>
        <form
          action={formAction}
          onSubmit={(e) => {
            if (!confirm("Rejeter ce retrait ?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="payoutId" value={payoutId} />
          <input type="hidden" name="action" value="reject" />
          <button
            type="submit"
            disabled={pending}
            className="text-xs border border-red-500/50 text-red-400 rounded-full px-3 py-1.5 font-medium disabled:opacity-50"
          >
            {pending ? "..." : "Rejeter"}
          </button>
        </form>
      </div>
      {state.error && <p className="text-red-400 text-[10px] mt-1">{state.error}</p>}
    </div>
  );
}
