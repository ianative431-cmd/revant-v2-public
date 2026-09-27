"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createShop } from "@/server/shops/actions";

const SHOP_TYPE_OPTIONS = [
  { value: "standard", label: "Boutique", hint: "Vêtements, accessoires, maison, électronique..." },
  { value: "restaurant", label: "Restaurant", hint: "Plats, boissons, restauration" },
] as const;

export default function CreateShopForm() {
  const [state, formAction, pending] = useActionState(createShop, { error: null });
  const [shopType, setShopType] = useState<"standard" | "restaurant">("standard");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold text-black/60 mb-2">Type de commerce</p>
        <div className="grid grid-cols-2 gap-2">
          {SHOP_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setShopType(option.value)}
              className={`text-left rounded-xl px-3 py-2.5 border ${
                shopType === option.value ? "border-black bg-black/5" : "border-black/15"
              }`}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block text-[11px] text-black/50">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <input type="hidden" name="shopType" value={shopType} />

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
