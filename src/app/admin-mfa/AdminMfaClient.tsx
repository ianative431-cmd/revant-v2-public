"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  mode: "enroll" | "challenge";
  factorId: string | null;
  email: string;
};

type Enrollment = { id: string; qrCode: string; secret: string };

export default function AdminMfaClient({ mode, factorId, email }: Props) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function beginEnrollment() {
    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      for (const factor of factors.all.filter((item) => item.factor_type === "totp" && item.status === "unverified")) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (removeError) {
          setError("Une ancienne configuration MFA inachevée empêche le redémarrage. Contacte l’assistance Revant pour la nettoyer.");
          return;
        }
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Revant Super Admin",
      });
      if (enrollError || !data || data.type !== "totp") throw enrollError ?? new Error("Enrollment unavailable");
      setEnrollment({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    } catch {
      setError("Impossible de démarrer la configuration. Vérifie que la MFA TOTP est activée dans Supabase Auth, puis réessaie.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const activeFactorId = enrollment?.id ?? factorId;
    const normalizedCode = code.replace(/\s/g, "");
    if (!activeFactorId || !/^\d{6}$/.test(normalizedCode)) {
      setError("Saisis le code à 6 chiffres de ton application d’authentification.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: activeFactorId });
      if (challengeError || !challenge) throw challengeError ?? new Error("Challenge unavailable");
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: activeFactorId,
        challengeId: challenge.id,
        code: normalizedCode,
      });
      if (verifyError) throw verifyError;

      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError || !assurance || assurance.currentLevel !== "aal2" || assurance.nextLevel !== "aal2") {
        throw new Error("AAL2 not reached");
      }
      router.replace("/admin");
      router.refresh();
    } catch (caught) {
      const errorCode = caught && typeof caught === "object" && "code" in caught
        ? String((caught as { code?: unknown }).code ?? "")
        : "";
      if (errorCode === "mfa_totp_verify_not_enabled") {
        setError("La vérification TOTP est désactivée dans Supabase Auth. L’administrateur technique doit l’activer avant de continuer.");
      } else if (errorCode === "mfa_challenge_expired") {
        setError("Le code a expiré. Demande un nouveau code et réessaie.");
      } else {
        setError("Code incorrect ou expiré. Vérifie l’heure de ton téléphone et réessaie.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0B10] px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-[#803e2f]">R</div>
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Revant · sécurité renforcée</p>
        <h1 className="mt-3 text-center text-2xl font-bold">{mode === "challenge" ? "Confirme ton identité" : "Sécurise l’espace super-admin"}</h1>
        <p className="mt-2 text-center text-sm text-white/60">{email ? `Compte : ${email}` : "Compte super-administrateur"}</p>

        {mode === "enroll" && !enrollment ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-6 text-white/75">L’accès super-administrateur exige une application d’authentification (Google Authenticator, Microsoft Authenticator ou équivalent). La configuration se fait une seule fois.</p>
            <button type="button" disabled={busy} onClick={beginEnrollment} className="w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0B0B10] disabled:opacity-50">{busy ? "Préparation…" : "Configurer l’authentification"}</button>
          </div>
        ) : (
          <>
            {enrollment && <div className="mt-6 rounded-2xl bg-white p-4 text-center text-neutral-900"><p className="text-sm font-semibold">1. Scanne ce QR code avec ton application</p><img src={`data:image/svg+xml;utf8,${encodeURIComponent(enrollment.qrCode)}`} alt="QR code de configuration MFA" className="mx-auto mt-3 h-48 w-48" /><p className="mt-2 text-xs text-neutral-500">Si tu ne peux pas scanner le code, saisis cette clé manuellement :</p><code className="mt-2 block break-all rounded-lg bg-neutral-100 p-3 text-sm font-bold">{enrollment.secret}</code></div>}
            <form onSubmit={verifyCode} className="mt-6 space-y-3">
              <label htmlFor="admin-mfa-code" className="block text-sm font-semibold">{enrollment ? "2. Code de confirmation" : "Code de ton application d’authentification"}</label>
              <input id="admin-mfa-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" maxLength={8} value={code} onChange={(event) => setCode(event.target.value.replace(/[^0-9 ]/g, ""))} required className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-4 text-center text-2xl tracking-[0.35em] outline-none focus:border-white/60" placeholder="000000" />
              <button type="submit" disabled={busy || code.replace(/\s/g, "").length !== 6} className="w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0B0B10] disabled:opacity-50">{busy ? "Vérification…" : "Valider et ouvrir l’administration"}</button>
            </form>
          </>
        )}
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <p className="mt-6 text-center text-xs leading-5 text-white/40">Ne partage jamais le QR code, la clé secrète ou les codes temporaires. L’administration reste bloquée tant que la vérification n’a pas réussi.</p>
      </section>
    </main>
  );
}
