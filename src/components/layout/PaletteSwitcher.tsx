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
    <div className="flex items-center gap-1.5" role="group" aria-label="Thème du site Revant">
      {ORDER.map((id) => {
        const p = SITE_PALETTES[id];
        const isActive = active === id;
        const isDark = id === "slate-lilac";
        return (
          <button
            key={id}
            type="button"
            onClick={() => choose(id)}
            aria-pressed={isActive}
            aria-label={p.label}
            title={p.label}
            className={`flex h-8 items-center gap-1.5 rounded-full border px-2 text-[10px] font-semibold ${isActive ? "border-[var(--brand-accent)] bg-[var(--brand-surface)] opacity-100" : "border-[var(--brand-border)] opacity-70"}`}
          >
            <span className={`h-3 w-3 rounded-full border border-black/10 ${isDark ? "bg-[#20252B]" : "bg-[#F8F5EF]"}`} />
            <span className={`h-3 w-3 rounded-full ${isDark ? "bg-[#FF914D]" : "bg-[#F46A18]"}`} />
          </button>
        );
      })}
    </div>
  );
}
