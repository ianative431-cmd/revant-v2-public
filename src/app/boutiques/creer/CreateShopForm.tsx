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
        <p className="mb-2 text-xs font-semibold text-[var(--brand-muted)]">Type de commerce</p>
        <div className="grid grid-cols-2 gap-2">
          {SHOP_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setShopType(option.value)}
              className={`rounded-xl border px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] ${
                shopType === option.value ? "border-[var(--brand-accent)] bg-[var(--brand-accent-soft)] ring-1 ring-[var(--brand-accent)]/20" : "border-[var(--brand-border)] bg-[var(--brand-surface)] hover:border-[var(--brand-accent)]"
              }`}
              aria-pressed={shopType === option.value}
            >
              <span className="block text-sm font-bold text-[var(--brand-text)]">{option.label}</span>
              <span className="mt-1 block text-[11px] leading-4 text-[var(--brand-muted)]">{option.hint}</span>
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
        className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)] placeholder:text-[var(--brand-muted)] focus:border-[var(--brand-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/15"
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
        className="w-full resize-none rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-text)] placeholder:text-[var(--brand-muted)] focus:border-[var(--brand-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/15"
      />
      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--brand-accent)] py-3 text-sm font-bold text-[var(--brand-accent-contrast)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Création..." : "Créer ma boutique"}
      </button>
    </form>
  );
}
