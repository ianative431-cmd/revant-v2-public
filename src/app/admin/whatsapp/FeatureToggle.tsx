"use client";

import { useState, useTransition } from "react";
import { toggleWhatsAppFeature, type WhatsAppFeature } from "@/server/admin/whatsapp-actions";

export default function FeatureToggle({
  feature,
  label,
  initialEnabled,
}: {
  feature: WhatsAppFeature;
  label: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    <div className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {error && <span className="text-red-600 text-[10px]">{error}</span>}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          disabled={pending}
          className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 ${
            enabled ? "bg-black" : "bg-black/20"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 block w-5 h-5 bg-white rounded-full transition-transform ${
              enabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}
