"use client";

import { useActionState } from "react";
import { setShopStatus } from "@/server/admin/moderation-actions";

export default function ShopStatusToggle({ shopId, status }: { shopId: string; status: string }) {
  const [state, formAction, pending] = useActionState(setShopStatus, { error: null });
  const nextStatus = status === "suspended" ? "active" : "suspended";

  return (
    <form action={formAction}>
      <input type="hidden" name="shopId" value={shopId} />
      <input type="hidden" name="nextStatus" value={nextStatus} />
      <button
        type="submit"
        disabled={pending}
        className={`text-xs rounded-full px-3 py-1.5 font-medium disabled:opacity-50 ${
          status === "suspended" ? "bg-black text-white" : "border border-red-600 text-red-600"
        }`}
      >
        {pending ? "..." : status === "suspended" ? "Réactiver" : "Suspendre"}
      </button>
      {state.error && <p className="text-red-600 text-[10px] mt-1">{state.error}</p>}
    </form>
  );
}
