"use client";

import { useActionState } from "react";
import { getShopStatusAction } from "@/lib/shop-status.mjs";
import { setShopStatus } from "@/server/admin/moderation-actions";

export default function ShopStatusToggle({ shopId, status }: { shopId: string; status: string }) {
  const action = getShopStatusAction(status);
  const [state, formAction, pending] = useActionState(setShopStatus, { error: null });

  if (!action) return null;

  return (
    <form action={formAction}>
      <input type="hidden" name="shopId" value={shopId} />
      <input type="hidden" name="nextStatus" value={action.nextStatus} />
      <button
        type="submit"
        disabled={pending}
        className={
          action.kind === "suspend"
            ? "rounded-full border border-red-600 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-50"
            : "rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        }
      >
        {pending ? "..." : action.label}
      </button>
      {state.error && <p className="mt-1 text-[10px] text-red-600">{state.error}</p>}
    </form>
  );
}
