"use client";

import { useState, useTransition } from "react";
import { toggleWhatsAppFeature, type WhatsAppFeature } from "@/server/admin/whatsapp-actions";

export default function FeatureToggle({
  feature,
  label,
  initialEnabled,
  disabledReason,
}: {
  feature: WhatsAppFeature;
  label: string;
  initialEnabled: boolean;
  disabledReason?: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const locked = Boolean(disabledReason) && !enabled;

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      const result = await toggleWhatsAppFeature(feature, next);
      if (result.error) {
        setEnabled(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-black/5 last:border-0">
      <div className="min-w-0 flex-1">
        <span className="text-sm">{label}</span>
        {disabledReason && <p className="mt-1 text-xs text-neutral-500">{disabledReason}</p>}
        {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={enabled}
        onClick={handleToggle}
        disabled={pending || locked}
        className={`h-6 w-11 shrink-0 rounded-full relative transition-colors disabled:opacity-50 ${
          enabled ? "bg-black" : "bg-black/20"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 block h-5 w-5 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
