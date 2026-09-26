"use client";

import { useActionState } from "react";
import { acceptUpdatedLegalDocuments } from "./actions";

export default function ReconsentForm() {
  const [state, formAction, pending] = useActionState(acceptUpdatedLegalDocuments, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="acceptUpdated" required className="mt-1" />
        <span>J&apos;ai lu et j&apos;accepte la version mise à jour de ces documents.</span>
      </label>
      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "J'accepte et je continue"}
      </button>
    </form>
  );
}
