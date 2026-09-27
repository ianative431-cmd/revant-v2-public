"use client";

import { useActionState } from "react";
import { selectShopBackground } from "@/server/backgrounds/actions";

export default function SelectBackgroundButton({
  kind,
  backgroundId,
  selected,
  label,
}: {
  kind: "official" | "personal" | "none";
  backgroundId?: string;
  selected: boolean;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(selectShopBackground, { error: null });

  if (selected) {
    return <span className="text-[11px] text-black/50">Sélectionné</span>;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="kind" value={kind} />
      {backgroundId && <input type="hidden" name="backgroundId" value={backgroundId} />}
      <button
        type="submit"
        disabled={pending}
        className={
          label
            ? "text-xs underline text-black/60 disabled:opacity-50"
            : "text-[11px] bg-black text-white rounded-full px-3 py-1.5 font-medium disabled:opacity-50"
        }
      >
        {pending ? "..." : label ?? "Choisir"}
      </button>
      {state.error && <p className="text-red-600 text-[10px] mt-1">{state.error}</p>}
    </form>
  );
}
