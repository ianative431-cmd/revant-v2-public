"use client";

import { useEffect, useState } from "react";
import { Check, Moon, Zap } from "lucide-react";
import PaletteSwitcher from "@/components/layout/PaletteSwitcher";
import type { SitePaletteId } from "@/content/theme/site-palette";

type MotionMode = "ultra" | "reduced";
type GlassLevel = "subtle" | "balanced" | "strong";
type TextScale = "normal" | "large";
type Settings = { motion: MotionMode; glass: GlassLevel; text: TextScale };

const STORAGE_KEY = "revant-display-preferences-v1";
const DEFAULTS: Settings = { motion: "ultra", glass: "subtle", text: "normal" };

function applySettings(settings: Settings) {
  const root = document.documentElement;
  root.dataset.revantMotion = settings.motion;
  root.dataset.revantGlass = settings.glass;
  root.dataset.revantText = settings.text;
}

export default function SettingsExperienceControls({ mode, currentPalette }: { mode: "appearance" | "interactions"; currentPalette: SitePaletteId }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Settings>;
        const next: Settings = {
          motion: parsed.motion === "reduced" ? "reduced" : "ultra",
          glass: parsed.glass === "balanced" || parsed.glass === "strong" ? parsed.glass : "subtle",
          text: parsed.text === "large" ? "large" : "normal",
        };
        setSettings(next);
        applySettings(next);
      } else applySettings(DEFAULTS);
    } catch { applySettings(DEFAULTS); }
    setReady(true);
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      applySettings(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Storage may be unavailable in private mode. */ }
      return next;
    });
  }

  if (!ready) return <div className="border-t border-brand-border px-4 py-4 text-xs text-brand-muted" aria-live="polite">Chargement des préférences…</div>;

  if (mode === "appearance") {
    return (
      <div className="space-y-4 border-t border-brand-border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold">Thème Revant</p><p className="mt-1 text-xs text-brand-muted">Clair ou sombre, selon votre préférence.</p></div>
          <PaletteSwitcher current={currentPalette} />
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">Intensité Liquid Glass</legend>
          <p className="mt-1 text-xs text-brand-muted">L&apos;effet reste limité aux surfaces de paramètres.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["subtle", "balanced", "strong"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={settings.glass === value} onClick={() => update("glass", value)} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-brand-border px-2 text-xs font-semibold aria-pressed:border-brand-accent aria-pressed:bg-brand-accent/10">
                {settings.glass === value && <Check size={14} />}
                {value === "subtle" ? "Discret" : value === "balanced" ? "Équilibré" : "Prononcé"}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t border-brand-border p-4 sm:p-5">
      <fieldset>
        <legend className="text-sm font-semibold">Réactivité et animations</legend>
        <p className="mt-1 text-xs text-brand-muted">Le profil ultra-rapide privilégie le retour immédiat. Les transitions interactives restent plafonnées à 120 ms.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" aria-pressed={settings.motion === "ultra"} onClick={() => update("motion", "ultra")} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-brand-border px-3 text-xs font-semibold aria-pressed:border-brand-accent aria-pressed:bg-brand-accent/10"><Zap size={14}/> Ultra-rapide</button>
          <button type="button" aria-pressed={settings.motion === "reduced"} onClick={() => update("motion", "reduced")} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-brand-border px-3 text-xs font-semibold aria-pressed:border-brand-accent aria-pressed:bg-brand-accent/10"><Moon size={14}/> Minimal</button>
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold">Taille du texte</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" aria-pressed={settings.text === "normal"} onClick={() => update("text", "normal")} className="min-h-11 rounded-xl border border-brand-border px-3 text-sm font-semibold aria-pressed:border-brand-accent aria-pressed:bg-brand-accent/10">Standard</button>
          <button type="button" aria-pressed={settings.text === "large"} onClick={() => update("text", "large")} className="min-h-11 rounded-xl border border-brand-border px-3 text-base font-semibold aria-pressed:border-brand-accent aria-pressed:bg-brand-accent/10">Plus grand</button>
        </div>
      </fieldset>
      <p className="text-[11px] leading-relaxed text-brand-muted">Ces préférences d&apos;affichage sont enregistrées sur cet appareil et ce navigateur. Elles ne sont pas encore synchronisées entre plusieurs appareils. Le réglage système « Réduire les animations » reste prioritaire.</p>
    </div>
  );
}
