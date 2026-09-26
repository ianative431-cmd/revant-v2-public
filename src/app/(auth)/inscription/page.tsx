"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUpWithEmail, sendPhoneOtp, verifyPhoneOtp } from "../actions";

function LegalSummaryAndConsent() {
  return (
    <div className="bg-black/[0.03] rounded-xl p-3 mb-3">
      <p className="text-xs text-black/70 mb-2">
        En créant un compte, tu acceptes notamment : une commission Revant de 0,5 % sur chaque
        vente, la mise en séquestre des fonds jusqu&apos;à confirmation de la remise du produit, et
        le traitement de tes données décrit dans notre politique de confidentialité.
      </p>
      <label className="flex items-start gap-2 text-xs mb-1">
        <input type="checkbox" name="acceptCgu" required className="mt-0.5" />
        <span>
          J&apos;accepte les{" "}
          <Link href="/legal/cgu" target="_blank" className="underline">
            Conditions Générales d&apos;Utilisation
          </Link>
        </span>
      </label>
      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" name="acceptConfidentialite" required className="mt-0.5" />
        <span>
          J&apos;accepte la{" "}
          <Link href="/legal/confidentialite" target="_blank" className="underline">
            Politique de confidentialité
          </Link>
        </span>
      </label>
    </div>
  );
}

export default function InscriptionPage() {
  const [mode, setMode] = useState<"email" | "phone">("email");

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Créer un compte</h1>
      <p className="text-sm text-black/60 mb-6">
        Rejoins Revant — seconde vie, nouvelle valeur.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex-1 py-2 rounded-full text-sm font-medium ${
            mode === "email" ? "bg-black text-white" : "bg-black/5"
          }`}
        >
          E-mail
        </button>
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`flex-1 py-2 rounded-full text-sm font-medium ${
            mode === "phone" ? "bg-black text-white" : "bg-black/5"
          }`}
        >
          Téléphone
        </button>
      </div>

      {mode === "email" ? <EmailSignupForm /> : <PhoneSignupForm />}

      <p className="text-sm text-black/60 mt-6 text-center">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-black font-medium underline">
          Connecte-toi
        </Link>
      </p>
    </div>
  );
}

function EmailSignupForm() {
  const [state, formAction, pending] = useActionState(signUpWithEmail, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        required
        maxLength={254}
        placeholder="E-mail"
        className="border rounded-xl px-4 py-3 text-sm"
      />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        maxLength={128}
        placeholder="Mot de passe (8 caractères min.)"
        className="border rounded-xl px-4 py-3 text-sm"
      />
      <LegalSummaryAndConsent />
      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Création..." : "Créer mon compte"}
      </button>
    </form>
  );
}

function PhoneSignupForm() {
  const [otpSent, setOtpSent] = useState(false);
  const [phone, setPhone] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyPhoneOtp, {
    error: null,
  });

  async function handleSend(formData: FormData) {
    setSending(true);
    setSendError(null);
    const result = await sendPhoneOtp({ error: null }, formData);
    setSending(false);
    if (result.error) {
      setSendError(result.error);
      return;
    }
    setPhone(String(formData.get("phone") ?? ""));
    setOtpSent(true);
  }

  if (!otpSent) {
    return (
      <form action={handleSend} className="flex flex-col gap-3">
        <input type="hidden" name="mode" value="inscription" />
        <input
          name="phone"
          type="tel"
          required
          placeholder="+22790000000"
          className="border rounded-xl px-4 py-3 text-sm"
        />
        <LegalSummaryAndConsent />
        {sendError && <p className="text-red-600 text-sm">{sendError}</p>}
        <button
          type="submit"
          disabled={sending}
          className="bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
        >
          {sending ? "Envoi..." : "Recevoir un code par SMS"}
        </button>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="flex flex-col gap-3">
      <input type="hidden" name="phone" value={phone} />
      <p className="text-sm text-black/60">Code envoyé au {phone}</p>
      <input
        name="code"
        type="text"
        inputMode="numeric"
        required
        maxLength={8}
        placeholder="Code reçu par SMS"
        className="border rounded-xl px-4 py-3 text-sm"
      />
      {verifyState.error && <p className="text-red-600 text-sm">{verifyState.error}</p>}
      <button
        type="submit"
        disabled={verifyPending}
        className="bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {verifyPending ? "Vérification..." : "Valider le code"}
      </button>
    </form>
  );
}
