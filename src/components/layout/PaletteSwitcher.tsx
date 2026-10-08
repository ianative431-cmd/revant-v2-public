"use client";

import { useState } from "react";
import { SITE_PALETTES, setSitePaletteCookie, type SitePaletteId } from "@/content/theme/site-palette";

const ORDER: SitePaletteId[] = ["terracotta", "slate-lilac"];

export default function PaletteSwitcher({ current }: { current: SitePaletteId }) {
  const [active, setActive] = useState(current);

  function choose(id: SitePaletteId) {
    if (id === active) return;
    document.documentElement.setAttribute("data-site-palette", id);
    setSitePaletteCookie(id);
    setActive(id);
  }

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Palette de couleurs du site">
      {ORDER.map((id) => {
        const p = SITE_PALETTES[id];
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => choose(id)}
            aria-pressed={isActive}
            aria-label={p.label}
            title={p.label}
            className={`h-6 w-6 rounded-full border-2 transition ${
              isActive ? "border-brand-text scale-110" : "border-transparent opacity-70"
            }`}
            style={{ background: `linear-gradient(135deg, ${p.bg} 50%, ${p.accent} 50%)` }}
          />
        );
      })}
    </div>
  );
}
