"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { DISPLAY_MODE_COOKIE, type DisplayMode } from "@/content/theme/display-mode";

const OPTIONS: { id: DisplayMode; label: string; Icon: typeof Monitor }[] = [
  { id: "system", label: "Système", Icon: Monitor },
  { id: "light", label: "Clair", Icon: Sun },
  { id: "dark", label: "Sombre", Icon: Moon },
];

export default function DisplayModeSwitcher({ current }: { current: DisplayMode }) {
  const [active, setActive] = useState(current);

  function choose(mode: DisplayMode) {
    if (mode === active) return;
    document.documentElement.dataset.themeMode = mode;
    document.cookie = `${DISPLAY_MODE_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
    setActive(mode);
  }

  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl border border-brand-border bg-brand-surface p-1" role="group" aria-label="Mode d’affichage">
      {OPTIONS.map(({ id, label, Icon }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => choose(id)}
            aria-pressed={selected}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent ${selected ? "bg-brand-accent-soft text-brand-text ring-1 ring-brand-accent" : "text-brand-muted hover:bg-brand-surface-soft"}`}
          >
            <Icon size={15} strokeWidth={2} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
