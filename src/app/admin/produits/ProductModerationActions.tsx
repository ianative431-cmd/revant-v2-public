"use client";

import { useActionState } from "react";
import {
  moderateProductAction,
  type AdminModerationState,
} from "@/server/admin/moderation-actions";

const INITIAL_STATE: AdminModerationState = { error: null };

export default function ProductModerationActions({
  productId,
  status,
  shopActive,
}: {
  productId: string;
  status: string;
  shopActive: boolean;
}) {
  const [state, formAction, pending] = useActionState(moderateProductAction, INITIAL_STATE);
  if (status !== "pending") return null;

  return (
    <div className="flex min-w-0 flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <form action={formAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="nextStatus" value="active" />
          <button
            type="submit"
            disabled={pending || !shopActive}
            title={!shopActive ? "La boutique doit être publiée avant l'annonce." : undefined}
            className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "..." : "Approuver"}
          </button>
        </form>
        <form action={formAction} className="flex flex-wrap justify-end gap-2">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="nextStatus" value="rejected" />
          <input
            name="reason"
            required
            minLength={5}
            maxLength={500}
            placeholder="Motif du refus"
            aria-label="Motif du refus"
            className="w-40 rounded-full border border-neutral-300 px-3 py-1.5 text-xs"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-red-600 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-40"
          >
            Refuser
          </button>
        </form>
      </div>
      {!shopActive && (
        <p className="max-w-64 text-right text-[10px] text-amber-700">
          Publie d&apos;abord la boutique avant d&apos;approuver cette annonce.
        </p>
      )}
      {state.error && <p role="alert" className="text-right text-[10px] text-red-600">{state.error}</p>}
    </div>
  );
}
