"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signInWithEmail, sendPhoneOtp, verifyPhoneOtp } from "../actions";

export default function ConnexionPage() {
  const [mode, setMode] = useState<"email" | "phone">("email");

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Connexion</h1>
      <p className="text-sm text-black/60 mb-6">Accède à ton compte Revant.</p>

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

      {mode === "email" ? <EmailLoginForm /> : <PhoneLoginForm />}

      <p className="text-sm text-black/60 mt-6 text-center">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-black font-medium underline">
          Inscris-toi
        </Link>
      </p>
    </div>
  );
}

function EmailLoginForm() {
  const [state, formAction, pending] = useActionState(signInWithEmail, { error: null });
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="relative">
        <input
          name="password"
          type={showPassword ? "text" : "password"}
          required
          maxLength={128}
          placeholder="Mot de passe"
          className="w-full border rounded-xl px-4 py-3 pr-20 text-sm"
        />
        <button
          type="button"
          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((visible) => !visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium underline"
        >
          {showPassword ? "Masquer" : "Afficher"}
        </button>
      </div>
      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}

function PhoneLoginForm() {
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
        <input
          name="phone"
          type="tel"
          required
          placeholder="+22790000000"
          className="border rounded-xl px-4 py-3 text-sm"
        />
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
