"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestInitialSuperAdminEmail, continueInitialSuperAdminBootstrap, type SecureAdminState } from "../secure-actions";

const initial: SecureAdminState = { error: null };

export default function InitialiserSuperAdminPage() {
  const [requestState, requestAction, requestPending] = useActionState(requestInitialSuperAdminEmail, initial);
  const [continueState, continueAction, continuePending] = useActionState(continueInitialSuperAdminBootstrap, initial);
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#171013] px-5 py-10 text-white">
      <section className="w-full max-w-md">
        <p className="mb-2 text-xs uppercase tracking-[.2em] text-white/45">Configuration unique</p>
        <h1 className="mb-3 text-2xl font-semibold">Initialiser le Super Admin</h1>
        <p className="mb-6 text-sm leading-6 text-white/60">
          Confirme la possession de l’adresse e-mail déjà associée au compte Super Admin. Le lien reçu est temporaire. Ensuite, l’activation du TOTP restera obligatoire avant de créer ta clé personnelle.
        </p>
        <form action={requestAction} className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <label htmlFor="bootstrap-email" className="mb-2 block text-sm text-white/75">E-mail du compte Super Admin existant</label>
          <input id="bootstrap-email" name="email" type="email" autoComplete="email" required maxLength={254} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-[#687650]" />
          {requestState.error && <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{requestState.error}</p>}
          {requestState.success && <p role="status" className="rounded-xl bg-[#687650]/20 p-3 text-sm text-white/80">Si l’adresse correspond au compte autorisé, un lien sécurisé a été envoyé. Ouvre-le sur cet appareil.</p>}
          <button disabled={requestPending} className="w-full rounded-xl bg-[#687650] px-4 py-3 font-semibold disabled:opacity-50">{requestPending ? "Envoi…" : "Envoyer le lien de vérification"}</button>
        </form>
        <form action={continueAction} className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="mb-3 text-sm leading-6 text-white/60">Après avoir ouvert le lien reçu, continue pour vérifier le rôle Super Admin et réserver la configuration unique.</p>
          {continueState.error && <p role="alert" className="mb-3 rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{continueState.error}</p>}
          <button disabled={continuePending} className="w-full rounded-xl border border-white/20 px-4 py-3 font-semibold disabled:opacity-50">{continuePending ? "Vérification…" : "J’ai ouvert le lien — continuer"}</button>
        </form>
        <p className="mt-5 text-center text-xs text-white/40">Une réservation atomique empêche deux comptes d’initialiser simultanément le Super Admin.</p>
        <p className="mt-4 text-center text-sm text-white/50"><Link href="/admin-connexion" className="underline">Retour à la connexion privée</Link></p>
      </section>
    </main>
  );
}
