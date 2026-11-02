"use client";

import { useActionState } from "react";
import Link from "next/link";
import { sendPasswordReset } from "../actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(sendPasswordReset, { error: null, success: false });

  return <div>
    <h1 className="text-xl font-bold mb-1">Mot de passe oublié ?</h1>
    <p className="text-sm text-black/60 mb-5">Indique l’adresse e-mail de ton compte. Si elle est associée à Revant, tu recevras un lien pour choisir un nouveau mot de passe.</p>
    {state.success ? <div className="rounded-xl bg-green-50 p-4 text-sm leading-6 text-green-900"><p className="font-semibold">Demande prise en compte</p><p className="mt-1">Si cette adresse correspond à un compte Revant, un e-mail de réinitialisation sera envoyé. Vérifie aussi tes courriers indésirables.</p></div> : <form action={formAction} className="flex flex-col gap-3">
      <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="Adresse e-mail" className="rounded-xl border px-4 py-3 text-sm" />
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-black py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Envoi…" : "Envoyer le lien"}</button>
    </form>}
    <p className="mt-6 text-center text-sm text-black/60"><Link href="/connexion" className="font-medium underline">Retour à la connexion</Link></p>
  </div>;
}
