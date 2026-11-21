"use client";

import Link from "next/link";

export default function GuestConfirmationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main role="alert" className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12 text-brand-text">
      <section className="w-full max-w-md rounded-3xl border border-brand-border bg-brand-surface p-7 text-center shadow-sm">
        <h1 className="text-xl font-black">Suivi temporairement indisponible</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted">Nous n’avons pas pu charger le suivi de ta commande. Garde ton numéro de commande et réessaie plus tard.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="min-h-11 rounded-full bg-brand-accent px-5 text-xs font-bold text-white">Réessayer</button>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-brand-border px-5 text-xs font-bold text-brand-text">Accueil</Link>
        </div>
      </section>
    </main>
  );
}
