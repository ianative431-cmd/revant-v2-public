"use client";

import { useActionState } from "react";
import { selectShopColorPalette } from "@/server/shops/actions";
import type { ShopColorPalette } from "@/content/shops/color-palettes";
import PaletteStackPreview from "./PaletteStackPreview";

export default function PaletteCard({
  palette,
  selected,
}: {
  palette: ShopColorPalette;
  selected: boolean;
}) {
  const [state, formAction, pending] = useActionState(selectShopColorPalette, { error: null });

  return (
    <div
      className={`rounded-[22px] border bg-[var(--brand-surface)] p-4 shadow-sm transition ${
        selected ? "border-[var(--brand-accent)] ring-2 ring-[var(--brand-accent)]/15" : "border-[var(--brand-border)]"
      }`}
      aria-current={selected ? "true" : undefined}
    >
      <PaletteStackPreview colors={palette.colors} />

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm font-bold text-[var(--brand-text)]">{palette.name}</span>
        {selected ? (
          <span className="rounded-full bg-[var(--brand-accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--brand-accent)]">Palette actuelle</span>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="paletteId" value={palette.id} />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[var(--brand-accent)] px-4 py-2 text-xs font-bold text-[var(--brand-accent-contrast)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "..." : "Choisir cette palette"}
            </button>
          </form>
        )}
      </div>

      {state.error && <p className="text-red-600 text-xs mt-2">{state.error}</p>}
    </div>
  );
}
