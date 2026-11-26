"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Check, Moon, Zap } from "lucide-react";

type MotionMode = "ultra" | "reduced";
type GlassMode = "subtle" | "balanced" | "strong";
type TextScale = "normal" | "large";
type Settings = { motion: MotionMode; glass: GlassMode; text: TextScale };
type SettingKey = keyof Settings;

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
  } catch { return DEFAULTS; }
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

function OptionButton({ selected, title, description, onClick, preview }: {
  selected: boolean; title: string; description: string; onClick: () => void; preview?: ReactNode;
}) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}
      className={`flex min-h-[76px] w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent ${selected ? "border-brand-accent bg-brand-accent/5" : "border-brand-border bg-brand-surface hover:bg-brand-bg"}`}>
      {preview && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-brand-accent">{preview}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-brand-text">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-brand-muted">{description}</span>
      </span>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-brand-accent bg-brand-accent text-white" : "border-brand-border text-transparent"}`}><Check size={12} aria-hidden="true" /></span>
    </button>
  );
}

export default function SettingsFeatureControl({ setting }: { setting: SettingKey }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "");
  const settings = useMemo(() => readSettings(raw), [raw]);
  useEffect(() => { applySettings(settings); }, [settings]);

  function update<K extends SettingKey>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value };
    applySettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch { /* Le navigateur peut refuser le stockage local en navigation privée. */ }
  }

  if (setting === "glass") {
    const options: { value: GlassMode; title: string; description: string; blur: string }[] = [
      { value: "subtle", title: "Discret", description: "Transparence légère, effet presque imperceptible", blur: "6 px" },
      { value: "balanced", title: "Équilibré", description: "Flou plus visible, tout en gardant le contenu lisible", blur: "10 px" },
      { value: "strong", title: "Prononcé", description: "Transparence et profondeur plus marquées", blur: "15 px" },
    ];
    return <div className="space-y-3">
      <p className="text-xs leading-relaxed text-brand-muted">Ce réglage agit uniquement sur les surfaces prévues pour l’effet Liquid Glass dans les paramètres. Il ne remplace pas l’identité visuelle de Revant.</p>
      {options.map((option) => <OptionButton key={option.value} selected={settings.glass === option.value} title={option.title} description={`${option.description} · ${option.blur}`} onClick={() => update("glass", option.value)} preview={<span className="h-5 w-5 rounded-lg border border-brand-accent/40 bg-brand-accent/10 shadow-sm" />} />)}
      <p className="pt-1 text-[11px] text-brand-muted">Enregistré sur cet appareil.</p>
    </div>;
  }

  if (setting === "motion") return <div className="space-y-3">
    <p className="text-xs leading-relaxed text-brand-muted">Choisis la vitesse des animations de l’interface. La préférence de réduction des animations de ton système reste prioritaire.</p>
    <OptionButton selected={settings.motion === "ultra"} title="Fluides et rapides" description="Transitions courtes et retours visuels dynamiques" onClick={() => update("motion", "ultra")} preview={<Zap size={19} />} />
    <OptionButton selected={settings.motion === "reduced"} title="Animations réduites" description="Limite les mouvements et les transitions" onClick={() => update("motion", "reduced")} preview={<Moon size={19} />} />
    <p className="pt-1 text-[11px] text-brand-muted">Enregistré sur cet appareil.</p>
  </div>;

  return <div className="space-y-3">
    <p className="text-xs leading-relaxed text-brand-muted">Ajuste la taille générale du texte pour améliorer le confort de lecture. Ce réglage peut modifier légèrement la disposition de certaines pages.</p>
    <OptionButton selected={settings.text === "normal"} title="Standard" description="Taille actuelle de Revant" onClick={() => update("text", "normal")} preview={<span className="text-sm font-bold">Aa</span>} />
    <OptionButton selected={settings.text === "large"} title="Texte agrandi" description="Augmente légèrement la taille générale du texte" onClick={() => update("text", "large")} preview={<span className="text-lg font-bold">Aa</span>} />
    <p className="pt-1 text-[11px] text-brand-muted">Enregistré sur cet appareil.</p>
  </div>;
}
