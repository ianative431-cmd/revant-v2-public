"use client";

import { useActionState } from "react";
import { verifySuperAdminRecoveryMfa, type SecureAdminState } from "../secure-actions";

export default function RecoveryMfaForm() {
  const [state, action, pending] = useActionState(verifySuperAdminRecoveryMfa, { error: null } as SecureAdminState);
  return (
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-xs uppercase tracking-[.2em] text-white/45">Deuxième facteur obligatoire</p>
      <h1 className="mt-2 text-2xl font-semibold">Confirmer ton identité</h1>
      <p className="my-4 text-sm leading-6 text-white/60">Le lien e-mail a été reconnu. Saisis maintenant le code de ton application TOTP pour autoriser la rotation de la clé.</p>
      <form action={action} className="space-y-3">
        <label htmlFor="recovery-totp-code" className="block text-sm text-white/75">Code de sécurité</label>
        <input id="recovery-totp-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" minLength={6} maxLength={8} required placeholder="000000" className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-center text-xl tracking-[.35em]" />
        {state.error && <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{state.error}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-[#687650] px-4 py-3 font-semibold disabled:opacity-50">{pending ? "Vérification…" : "Valider le second facteur"}</button>
      </form>
    </section>
  );
}
