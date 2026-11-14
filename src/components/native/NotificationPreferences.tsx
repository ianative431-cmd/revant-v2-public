"use client";

import { useEffect, useState } from "react";

type Preferences = {
  orders: boolean;
  payments: boolean;
  messages: boolean;
  deliveries: boolean;
  promotions: boolean;
  security: boolean;
  system: boolean;
};

const DEFAULTS: Preferences = {
  orders: true,
  payments: true,
  messages: true,
  deliveries: true,
  promotions: false,
  security: true,
  system: true,
};

const OPTIONS: { key: keyof Preferences; label: string; description: string }[] = [
  { key: "orders", label: "Commandes", description: "Confirmation, préparation et remise" },
  { key: "payments", label: "Paiements", description: "Paiements, remboursements et versements" },
  { key: "messages", label: "Messages", description: "Nouveaux messages et réponses" },
  { key: "deliveries", label: "Livraisons", description: "Attribution, progression et incidents" },
  { key: "promotions", label: "Promotions", description: "Offres et actualités commerciales" },
  { key: "security", label: "Sécurité", description: "Connexions et alertes de sécurité" },
  { key: "system", label: "Informations Revant", description: "Informations importantes sur le service" },
];

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setNativeAvailable(Boolean(window.RevantNative));
    let active = true;
    fetch("/api/native/notification-preferences", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Impossible de charger les préférences.");
        return response.json() as Promise<Preferences>;
      })
      .then((data) => {
        if (active) setPreferences({ ...DEFAULTS, ...data });
      })
      .catch(() => {
        if (active) setMessage("Les préférences n’ont pas pu être chargées. Réessaie.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function savePreferences() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/native/notification-preferences", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (!response.ok) throw new Error("Enregistrement impossible.");
      setMessage("Préférences enregistrées.");
    } catch {
      setMessage("Impossible d’enregistrer les préférences. Réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-5 rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-brand-text">Mes préférences de notification</h2>
          <p className="mt-1 text-xs leading-relaxed text-brand-muted">
            Choisis les catégories pour lesquelles tu souhaites recevoir des alertes.
          </p>
        </div>
        {nativeAvailable && (
          <button
            type="button"
            onClick={() => window.RevantNative?.requestPushPermission?.()}
            className="rounded-full bg-brand-accent px-3 py-2 text-xs font-semibold text-white"
          >
            Activer sur cet iPhone
          </button>
        )}
      </div>

      <div className="mt-4 divide-y divide-brand-border">
        {OPTIONS.map((option) => (
          <label key={option.key} className="flex cursor-pointer items-center justify-between gap-4 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-brand-text">{option.label}</span>
              <span className="mt-0.5 block text-xs text-brand-muted">{option.description}</span>
            </span>
            <input
              type="checkbox"
              checked={preferences[option.key]}
              disabled={loading}
              onChange={(event) => setPreferences((current) => ({
                ...current,
                [option.key]: event.target.checked,
              }))}
              className="h-5 w-5 shrink-0 accent-[var(--brand-accent)]"
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-xs text-brand-muted">{message}</p>
        <button
          type="button"
          onClick={savePreferences}
          disabled={loading || saving}
          className="rounded-full border border-brand-border px-4 py-2 text-xs font-semibold text-brand-text disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </section>
  );
}
