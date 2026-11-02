"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePassword } from "@/app/(auth)/actions";

export default function ReinitialiserMotDePassePage() {
  const [state, action, pending] = useActionState(updatePassword, { error: null });
  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-xl font-bold">Créer un nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-black/60">Choisis un mot de passe de 8 à 128 caractères.</p>
      <form action={action} className="mt-5 flex flex-col gap-3">
        <input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" placeholder="Nouveau mot de passe" className="rounded-xl border px-4 py-3 text-sm" />
        <input name="confirmation" type="password" required minLength={8} maxLength={128} autoComplete="new-password" placeholder="Confirmer le mot de passe" className="rounded-xl border px-4 py-3 text-sm" />
        {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
        <button disabled={pending} className="rounded-full bg-black py-3 text-sm font-medium text-white disabled:opacity-50">{pending ? "Mise à jour..." : "Enregistrer le mot de passe"}</button>
      </form>
      <Link href="/connexion" className="mt-5 inline-block text-sm underline">Retour à la connexion</Link>
    </section>
  );
}
