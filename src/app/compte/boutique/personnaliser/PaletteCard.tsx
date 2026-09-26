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
      className={`rounded-2xl p-4 border ${
        selected ? "border-black" : "border-black/10"
      }`}
    >
      <PaletteStackPreview colors={palette.colors} />

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm font-medium">{palette.name}</span>
        {selected ? (
          <span className="text-xs text-black/60">Palette actuelle</span>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="paletteId" value={palette.id} />
            <button
              type="submit"
              disabled={pending}
              className="text-xs bg-black text-white rounded-full px-4 py-2 font-medium disabled:opacity-50"
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
