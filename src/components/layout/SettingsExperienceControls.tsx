"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Moon, Zap } from "lucide-react";
import PaletteSwitcher from "@/components/layout/PaletteSwitcher";
import type { SitePaletteId } from "@/content/theme/site-palette";

type MotionMode = "ultra" | "reduced";
type TextScale = "normal" | "large";
type Settings = { motion: MotionMode; glass: "subtle" | "balanced" | "strong"; text: TextScale };

const STORAGE_KEY = "revant-display-preferences-v1";
const CHANGE_EVENT = "revant-display-preferences";
const DEFAULTS: Settings = { motion: "ultra", glass: "subtle", text: "normal" };

function readSettings(raw: string): Settings {
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      motion: parsed.motion === "reduced" ? "reduced" : "ultra",
      glass: parsed.glass === "balanced" || parsed.glass === "strong" ? parsed.glass : "subtle",
      text: parsed.text === "large" ? "large" : "normal",
    };
  } catch {
    return DEFAULTS;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot() {
  try { return localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; }
}

function applySettings(settings: Settings) {
  const root = document.documentElement;
  root.dataset.revantMotion = settings.motion;
  root.dataset.revantGlass = settings.glass;
  root.dataset.revantText = settings.text;
}

export default function SettingsExperienceControls({ mode, currentPalette }: { mode: "appearance" | "interactions"; currentPalette: SitePaletteId }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "");
  const settings = useMemo(() => readSettings(raw), [raw]);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value };
    applySettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch { /* Storage may be unavailable in private mode. */ }
  }

  if (mode === "appearance") {
    return <PaletteSwitcher current={currentPalette} />;
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-sm font-semibold">Animations</legend>
        <p className="mt-0.5 text-xs text-brand-muted">Ultra-rapides ou réduites.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" aria-pressed={settings.motion === "ultra"} onClick={() => update("motion", "ultra")} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-brand-border px-3 text-xs font-semibold aria-pressed:border-brand-accent aria-pressed:bg-brand-accent/10"><Zap size={14} /> Ultra-rapides</button>
          <button type="button" aria-pressed={settings.motion === "reduced"} onClick={() => update("motion", "reduced")} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-brand-border px-3 text-xs font-semibold aria-pressed:border-brand-accent aria-pressed:bg-brand-accent/10"><Moon size={14} /> Réduites</button>
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold">Taille du texte</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" aria-pressed={settings.text === "normal"} onClick={() => update("text", "normal")} className="min-h-10 rounded-xl border border-brand-border px-3 text-xs font-semibold aria-pressed:border-brand-accent aria-pressed:bg-brand-accent/10">Standard</button>
          <button type="button" aria-pressed={settings.text === "large"} onClick={() => update("text", "large")} className="min-h-10 rounded-xl border border-brand-border px-3 text-xs font-semibold aria-pressed:border-brand-accent aria-pressed:bg-brand-accent/10">Plus grand</button>
        </div>
      </fieldset>
      <p className="text-[11px] leading-relaxed text-brand-muted">Enregistré sur cet appareil. Le réglage système de réduction des animations reste prioritaire.</p>
    </div>
  );
}
