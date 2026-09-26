"use client";

import { useActionState } from "react";
import { createShop } from "@/server/shops/actions";

export default function CreateShopForm() {
  const [state, formAction, pending] = useActionState(createShop, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="name"
        type="text"
        required
        minLength={2}
        maxLength={80}
        placeholder="Nom de la boutique"
        className="border rounded-xl px-4 py-3 text-sm"
      />
      <input
        name="slogan"
        type="text"
        maxLength={120}
        placeholder="Slogan (facultatif)"
        className="border rounded-xl px-4 py-3 text-sm"
      />
      <textarea
        name="description"
        maxLength={1000}
        rows={4}
        placeholder="Description (facultatif)"
        className="border rounded-xl px-4 py-3 text-sm resize-none"
      />
      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Création..." : "Créer ma boutique"}
      </button>
    </form>
  );
}
