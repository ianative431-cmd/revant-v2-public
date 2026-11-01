"use client";

import { useState, useTransition } from "react";
import { getKycDocumentUrl } from "@/server/admin/kyc-actions";

export default function KycDocumentButton({ kycId }: { kycId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadDocument() {
    setError(null);
    setUrl(null);
    startTransition(async () => {
      const result = await getKycDocumentUrl(kycId);
      if (result.url) setUrl(result.url);
      else setError(result.error ?? "Document indisponible.");
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={loadDocument}
        disabled={pending}
        className="rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold hover:bg-black/5 disabled:opacity-50"
      >
        {pending ? "Préparation du lien…" : "Générer un accès sécurisé"}
      </button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block text-xs font-semibold text-[#803e2f] underline"
        >
          Ouvrir le document (lien valable 60 secondes)
        </a>
      )}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
