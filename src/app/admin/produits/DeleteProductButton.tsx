"use client";

import { useActionState } from "react";
import { deleteProductAsAdmin } from "@/server/admin/moderation-actions";

export default function DeleteProductButton({
  productId,
  imageUrls,
}: {
  productId: string;
  imageUrls: string[];
}) {
  const [state, formAction, pending] = useActionState(deleteProductAsAdmin, { error: null });

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Supprimer définitivement cette annonce ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="imageUrls" value={imageUrls.join(",")} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs border border-red-600 text-red-600 rounded-full px-3 py-1.5 font-medium disabled:opacity-50"
      >
        {pending ? "..." : "Supprimer"}
      </button>
      {state.error && <p className="text-red-600 text-[10px] mt-1">{state.error}</p>}
    </form>
  );
}
