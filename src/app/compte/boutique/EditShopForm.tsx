"use client";

import { useActionState } from "react";
import { updateShop } from "@/server/shops/actions";

type Props = {
  initialName: string;
  initialDescription: string;
  initialSlug: string;
};

export default function EditShopForm({
  initialName,
  initialDescription,
  initialSlug,
}: Props) {
  const [state, formAction, pending] = useActionState(updateShop, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="text-xs text-black/60">
        Nom
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          defaultValue={initialName}
          className="mt-1 w-full border rounded-xl px-4 py-3 text-sm"
        />
      </label>

      <label className="text-xs text-black/60">
        Description
        <textarea
          name="description"
          maxLength={1000}
          rows={4}
          defaultValue={initialDescription}
          className="mt-1 w-full border rounded-xl px-4 py-3 text-sm resize-none"
        />
      </label>

      <label className="text-xs text-black/60">
        Adresse de la boutique (revant.app/shop/...)
        <input
          name="slug"
          type="text"
          required
          minLength={3}
          maxLength={40}
          pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
          defaultValue={initialSlug}
          className="mt-1 w-full border rounded-xl px-4 py-3 text-sm"
        />
      </label>
      <p className="text-xs text-black/40 -mt-2">
        Si tu changes l&apos;adresse, l&apos;ancienne continuera de rediriger automatiquement vers
        la nouvelle.
      </p>

      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
