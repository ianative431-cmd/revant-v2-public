"use client";

import { useActionState } from "react";
import { requestSuperAdminKeyRecovery, type SecureAdminState } from "../secure-actions";

export default function RecoveryRequestForm() {
  const [state, action, pending] = useActionState(requestSuperAdminKeyRecovery, { error: null } as SecureAdminState);
  return (
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-xs uppercase tracking-[.2em] text-white/45">Récupération contrôlée</p>
      <h1 className="mt-2 text-2xl font-semibold">Réinitialiser la clé Super Admin</h1>
      <p className="my-4 text-sm leading-6 text-white/60">Un lien sera envoyé à l’adresse enregistrée. Après ouverture, la validation TOTP restera obligatoire. L’e-mail seul ne remplace jamais le second facteur.</p>
      <form action={action} className="space-y-3">
        <label htmlFor="recovery-email" className="block text-sm text-white/75">Adresse e-mail enregistrée</label>
        <input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={254} required className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3" />
        {state.error && <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{state.error}</p>}
        {state.success && <p role="status" className="rounded-xl bg-[#687650]/20 p-3 text-sm text-white/80">Si l’adresse correspond au compte autorisé, un lien sécurisé a été envoyé. Vérifie ta boîte de réception.</p>}
        <button disabled={pending} className="w-full rounded-xl bg-[#687650] px-4 py-3 font-semibold disabled:opacity-50">{pending ? "Envoi…" : "Envoyer le lien de récupération"}</button>
      </form>
    </section>
  );
}
