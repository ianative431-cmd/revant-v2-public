"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { beginBootstrapTotpEnrollment, verifyBootstrapTotpEnrollment, type SecureAdminState } from "../secure-actions";

export default function SecureTotpEnrollment() {
  const [setup, setSetup] = useState<{ error: string | null; factorId?: string; qrCode?: string | null; secret?: string | null; alreadyVerified?: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const [state, verifyAction, verifyPending] = useActionState(verifyBootstrapTotpEnrollment, { error: null } as SecureAdminState);
  const [startError, setStartError] = useState<string | null>(null);
  function start() {
    setStartError(null);
    startTransition(async () => {
      const result = await beginBootstrapTotpEnrollment();
      setSetup(result);
      if (result.error) setStartError(result.error);
    });
  }
  return (
    <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
      <p className="text-xs uppercase tracking-[.2em] text-white/45">Sécurité supplémentaire</p>
      <h1 className="mt-2 text-xl font-semibold">Protéger le Super Admin</h1>
      <p className="my-4 text-sm leading-6 text-white/65">La possession de l’e-mail est confirmée. Active maintenant un code temporaire à six chiffres dans une application d’authentification.</p>
      {!setup && <button type="button" onClick={start} disabled={pending} className="w-full rounded-xl bg-[#687650] px-4 py-3 font-semibold disabled:opacity-50">{pending ? "Préparation…" : "Configurer l’authentification"}</button>}
      {startError && <p role="alert" className="mt-3 rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{startError}</p>}
      {setup?.alreadyVerified && <p className="mt-4 rounded-xl bg-[#203426] p-3 text-sm">Un facteur TOTP est déjà vérifié. Reconnecte-toi avec ton code pour poursuivre.</p>}
      {setup?.qrCode && <div className="mt-5 space-y-4">
        <div className="rounded-2xl bg-white p-4 text-center"><Image src={setup.qrCode} alt="QR code TOTP" width={192} height={192} unoptimized className="mx-auto h-48 w-48" /></div>
        <div className="rounded-xl border border-white/10 p-3"><p className="mb-1 text-xs text-white/50">Clé de configuration manuelle</p><code className="break-all text-sm text-white">{setup.secret}</code></div>
        <form action={verifyAction} className="space-y-3">
          <input type="hidden" name="factorId" value={setup.factorId ?? ""} />
          <label htmlFor="bootstrap-totp-code" className="block text-sm text-white/75">Code généré par ton application</label>
          <input id="bootstrap-totp-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" minLength={6} maxLength={8} required className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-center text-xl tracking-[.35em]" placeholder="000000" />
          {state.error && <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{state.error}</p>}
          <button disabled={verifyPending} className="w-full rounded-xl bg-[#687650] px-4 py-3 font-semibold disabled:opacity-50">{verifyPending ? "Vérification…" : "Vérifier et continuer"}</button>
        </form>
      </div>}
      <p className="mt-5 text-xs leading-5 text-white/40">Ne partage jamais le secret TOTP ni ta clé d’accès personnelle.</p>
    </section>
  );
}
