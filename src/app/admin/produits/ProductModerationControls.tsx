"use client";

import { useActionState } from "react";
import type { ProductStatus } from "@/types/product";
import { moderateProductStatus } from "@/server/admin/product-moderation-actions";

export default function ProductModerationControls({
  productId,
  status,
}: {
  productId: string;
  status: ProductStatus;
}) {
  const [state, formAction, pending] = useActionState(moderateProductStatus, { error: null });

  if (status !== "pending") return null;

  return (
    <form action={formAction} className="flex w-full max-w-56 flex-col gap-2">
      <input type="hidden" name="productId" value={productId} />
      <input
        type="text"
        name="note"
        maxLength={500}
        placeholder="Motif (obligatoire pour un refus)"
        aria-label="Motif de modération"
        className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-[10px]"
      />
      <div className="flex flex-wrap justify-end gap-1.5">
        <button
          type="submit"
          name="nextStatus"
          value="active"
          disabled={pending}
          className="rounded-full bg-emerald-700 px-3 py-1.5 text-[10px] font-semibold text-white disabled:opacity-50"
        >
          {pending ? "..." : "Approuver"}
        </button>
        <button
          type="submit"
          name="nextStatus"
          value="rejected"
          disabled={pending}
          className="rounded-full border border-red-300 px-3 py-1.5 text-[10px] font-semibold text-red-700 disabled:opacity-50"
        >
          Refuser
        </button>
      </div>
      {state.error && <p role="alert" className="text-right text-[10px] text-red-600">{state.error}</p>}
    </form>
  );
}
