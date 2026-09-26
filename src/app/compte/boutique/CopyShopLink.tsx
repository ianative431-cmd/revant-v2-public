"use client";

import { useState } from "react";

export default function CopyShopLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible (permission refusée, navigateur trop
      // ancien...) : on affiche le lien complet pour copie manuelle
      // plutôt que de prétendre que l'action a réussi.
      setError(true);
    }
  }

  return (
    <div className="mt-3 w-full text-center">
      <p className="text-xs text-black/60 break-all mb-2">{url}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="text-xs underline text-black/80"
      >
        {copied ? "Lien copié !" : "Copier le lien"}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1">
          Copie automatique indisponible — copie le lien ci-dessus manuellement.
        </p>
      )}
    </div>
  );
}
