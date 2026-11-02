"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/(auth)/actions";

export default function MotDePasseOubliePage() {
  const [state, action, pending] = useActionState(requestPasswordReset, { error: null });
  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-xl font-bold">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-black/60">Saisis l&apos;adresse e-mail de ton compte. Si elle est associée à un compte, un lien sécurisé sera envoyé.</p>
      <form action={action} className="mt-5 flex flex-col gap-3">
        <input name="email" type="email" required maxLength={254} placeholder="Adresse e-mail" className="rounded-xl border px-4 py-3 text-sm" />
        {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">Si cette adresse correspond à un compte, un lien de réinitialisation vient d&apos;être envoyé. Vérifie aussi les courriers indésirables.</p>}
        <button disabled={pending} className="rounded-full bg-black py-3 text-sm font-medium text-white disabled:opacity-50">{pending ? "Envoi..." : "Envoyer le lien"}</button>
      </form>
      <Link href="/connexion" className="mt-5 inline-block text-sm underline">Retour à la connexion</Link>
    </section>
  );
}
