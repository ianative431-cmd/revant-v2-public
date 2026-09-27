"use client";

import { useActionState } from "react";
import { createBackground } from "@/server/backgrounds/admin-actions";

const SUGGESTED_CATEGORIES = [
  "Minimal", "Nature", "Luxe", "Studio", "Sombre", "Clair",
  "Vert", "Terre", "Enfant", "Mode", "Technologie", "Alimentaire", "Autres",
];

export default function NewBackgroundForm() {
  const [state, formAction, pending] = useActionState(createBackground, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="file"
        name="image"
        accept="image/jpeg,image/png,image/webp"
        required
        className="text-sm"
      />

      <input
        name="name"
        type="text"
        required
        minLength={2}
        maxLength={80}
        placeholder="Nom de l'arrière-plan"
        className="border rounded-xl px-4 py-3 text-sm"
      />

      <input
        name="category"
        type="text"
        list="bg-categories"
        placeholder="Catégorie (ex. Studio, Nature...)"
        className="border rounded-xl px-4 py-3 text-sm"
      />
      <datalist id="bg-categories">
        {SUGGESTED_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <textarea
        name="description"
        maxLength={500}
        rows={3}
        placeholder="Description (facultatif)"
        className="border rounded-xl px-4 py-3 text-sm resize-none"
      />

      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Envoi..." : "Ajouter à la bibliothèque"}
      </button>
    </form>
  );
}
