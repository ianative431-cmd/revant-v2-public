"use client";

import { useState, useTransition } from "react";
import { verifyConnection, testWebhook, disconnectWhatsApp } from "@/server/admin/whatsapp-actions";

function ActionButton({
  label,
  pendingLabel,
  variant = "default",
  onRun,
  confirmMessage,
}: {
  label: string;
  pendingLabel: string;
  variant?: "default" | "danger";
  onRun: () => Promise<{ error: string | null; info?: string | null }>;
  confirmMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error: string | null; info?: string | null } | null>(null);

  function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setResult(null);
    startTransition(async () => {
      setResult(await onRun());
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`text-sm rounded-full px-4 py-2 font-medium disabled:opacity-50 ${
          variant === "danger"
            ? "border border-red-600 text-red-600"
            : "border border-black/15 text-black"
        }`}
      >
        {pending ? pendingLabel : label}
      </button>
      {result?.error && <p className="text-red-600 text-xs mt-1">{result.error}</p>}
      {result?.info && !result.error && <p className="text-black/60 text-xs mt-1">{result.info}</p>}
    </div>
  );
}

export function VerifyConnectionButton() {
  return (
    <ActionButton label="Vérifier la connexion" pendingLabel="Vérification..." onRun={verifyConnection} />
  );
}

export function TestWebhookButton() {
  return <ActionButton label="Tester le webhook" pendingLabel="Test en cours..." onRun={testWebhook} />;
}

export function DisconnectButton() {
  return (
    <ActionButton
      label="Déconnecter WhatsApp"
      pendingLabel="Déconnexion..."
      variant="danger"
      confirmMessage={
        "Déconnecter WhatsApp Business ? Revant ne pourra plus envoyer ni recevoir de messages tant qu'une nouvelle connexion n'est pas établie. Aucune donnée Revant (commandes, utilisateurs, etc.) ne sera supprimée."
      }
      onRun={disconnectWhatsApp}
    />
  );
}
