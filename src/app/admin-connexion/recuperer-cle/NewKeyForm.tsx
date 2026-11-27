"use client";

import { useActionState, useState } from "react";
import { rotateSuperAdminAccessKey, type SecureAdminState } from "../secure-actions";

function generateKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export default function NewSuperAdminKeyForm() {
  const [state, action, pending] = useActionState(rotateSuperAdminAccessKey, { error: null } as SecureAdminState);
  const [key, setKey] = useState("");
  return (
    <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-xs uppercase tracking-[.2em] text-white/45">Identité confirmée</p>
      <h1 className="mt-2 text-2xl font-semibold">Créer une nouvelle clé</h1>
      <p className="my-4 text-sm leading-6 text-white/60">L’e-mail et le TOTP ont été vérifiés. Génère une nouvelle clé de 256 bits et conserve-la hors de Revant. En cas d’interruption, réutilise exactement la même clé pour reprendre l’opération en cours.</p>
      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="new-super-admin-key" className="mb-2 block text-sm text-white/75">Nouvelle clé (64 caractères hexadécimaux)</label>
          <input id="new-super-admin-key" name="accessKey" value={key} onChange={(event) => setKey(event.target.value)} type="text" autoComplete="off" spellCheck={false} minLength={64} maxLength={64} pattern="[a-fA-F0-9]{64}" required className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-mono text-sm" />
          <div className="mt-2 flex gap-4"><button type="button" onClick={() => setKey(generateKey())} className="text-xs font-semibold text-[#a8bd83] underline">Générer une clé forte</button><button type="button" disabled={!key} onClick={() => void navigator.clipboard.writeText(key)} className="text-xs font-semibold text-white/70 underline disabled:opacity-40">Copier la clé</button></div>
        </div>
        <div><label htmlFor="new-super-admin-key-confirm" className="mb-2 block text-sm text-white/75">Confirmer la nouvelle clé</label><input id="new-super-admin-key-confirm" name="accessKeyConfirmation" type="password" autoComplete="off" minLength={64} maxLength={64} pattern="[a-fA-F0-9]{64}" required className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-mono text-sm" /></div>
        {state.error && <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{state.error}</p>}
        <button disabled={pending || !key} className="w-full rounded-xl bg-[#687650] px-4 py-3 font-semibold disabled:opacity-50">{pending ? "Rotation sécurisée…" : "Enregistrer la nouvelle clé"}</button>
      </form>
    </section>
  );
}
