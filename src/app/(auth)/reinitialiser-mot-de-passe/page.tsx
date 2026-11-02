"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updatePassword } from "../actions";

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, { error: null });
  const [showPassword, setShowPassword] = useState(false);

  return <div>
    <h1 className="text-xl font-bold mb-1">Créer un nouveau mot de passe</h1>
    <p className="text-sm text-black/60 mb-5">Choisis un mot de passe de 10 caractères minimum. Les autres sessions seront fermées après la modification si Supabase confirme l’opération.</p>
    <form action={formAction} className="flex flex-col gap-3">
      <input name="password" type={showPassword ? "text" : "password"} required minLength={10} maxLength={128} autoComplete="new-password" placeholder="Nouveau mot de passe (10 caractères min.)" className="rounded-xl border px-4 py-3 text-sm" />
      <input name="confirmation" type={showPassword ? "text" : "password"} required minLength={10} maxLength={128} autoComplete="new-password" placeholder="Confirmer le mot de passe" className="rounded-xl border px-4 py-3 text-sm" />
      <button type="button" onClick={() => setShowPassword((value) => !value)} className="self-end text-xs font-medium underline">{showPassword ? "Masquer les mots de passe" : "Afficher les mots de passe"}</button>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-black py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Mise à jour…" : "Enregistrer le nouveau mot de passe"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-black/60"><Link href="/connexion" className="font-medium underline">Retour à la connexion</Link></p>
  </div>;
}
