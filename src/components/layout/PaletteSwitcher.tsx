"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
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
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] p-1 shadow-sm" role="group" aria-label="Thème du site Revant">
      {ORDER.map((id) => {
        const isActive = active === id;
        const isDark = id === "slate-lilac";
        const Icon = isDark ? Moon : Sun;
        return (
          <button
            key={id}
            type="button"
            onClick={() => choose(id)}
            aria-pressed={isActive}
            aria-label={SITE_PALETTES[id].label}
            title={SITE_PALETTES[id].label}
            className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] ${isActive
              ? "border border-[var(--brand-accent)] bg-[var(--brand-accent-soft)] text-[var(--brand-text)] shadow-sm"
              : "border border-transparent text-[var(--brand-muted)] hover:bg-[var(--brand-accent-soft)]"}`}
          >
            <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
            <span>{isDark ? "Sombre" : "Clair"}</span>
          </button>
        );
      })}
    </div>
  );
}
