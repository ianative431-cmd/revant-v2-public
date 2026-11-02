"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePassword } from "../actions";

export default function ReinitialiserMotDePassePage() {
  const [state, formAction, pending] = useActionState(updatePassword, { error: null });

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold">Choisir un nouveau mot de passe</h1>
      <p className="mb-5 text-sm text-black/60">
        Crée un mot de passe de 8 caractères minimum pour sécuriser ton compte Revant.
      </p>

      <form action={formAction} className="flex flex-col gap-3">
        <label htmlFor="password" className="text-xs font-medium text-black/65">Nouveau mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="rounded-xl border px-4 py-3 text-sm"
        />
        <label htmlFor="confirmation" className="text-xs font-medium text-black/65">Confirmer le mot de passe</label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="rounded-xl border px-4 py-3 text-sm"
        />
        {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-black py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Modification…" : "Enregistrer le nouveau mot de passe"}
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-black/50">
        Le lien a expiré ?{" "}
        <Link href="/mot-de-passe-oublie" className="font-medium underline">Demander un nouveau lien</Link>
      </p>
    </main>
  );
}
