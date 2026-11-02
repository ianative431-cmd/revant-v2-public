"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../actions";

export default function MotDePasseOubliePage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, { error: null });

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold">Mot de passe oublié ?</h1>
      <p className="mb-5 text-sm text-black/60">
        Indique l'adresse e-mail associée à ton compte. Si un compte existe, Revant enverra un lien de réinitialisation.
      </p>

      {state.success ? (
        <div className="space-y-4" role="status" aria-live="polite">
          <p className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
            Si cette adresse est associée à un compte, un e-mail contenant un lien de réinitialisation vient d'être envoyé. Vérifie aussi tes courriers indésirables.
          </p>
          <Link href="/connexion" className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <label htmlFor="email" className="text-xs font-medium text-black/65">Adresse e-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="nom@exemple.com"
            className="rounded-xl border px-4 py-3 text-sm"
          />
          {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-black py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Envoi en cours…" : "Envoyer le lien"}
          </button>
          <Link href="/connexion" className="mt-2 text-center text-sm text-black/60 underline">
            Retour à la connexion
          </Link>
        </form>
      )}
    </main>
  );
}
