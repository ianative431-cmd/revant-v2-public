"use client";

import { useEffect, useState } from "react";
import { exchangeMetaCode } from "@/server/admin/whatsapp-actions";

declare global {
  interface Window {
    FB?: {
      init: (opts: Record<string, unknown>) => void;
      login: (
        callback: (response: {
          authResponse?: { code?: string };
          status?: string;
        }) => void,
        opts: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type Props = {
  appId: string | null;
  configId: string | null;
  label?: string;
};

/**
 * Déclenche le flux officiel Meta Embedded Signup via le SDK
 * JavaScript Facebook (FB.login avec config_id). Le code renvoyé par
 * Meta est transmis au serveur pour l'échange contre un token — ce
 * composant ne manipule jamais de secret, seulement le `code`
 * éphémère.
 *
 * Si l'App ID / Config ID Meta ne sont pas configurés, le bouton
 * l'indique clairement au lieu de simuler une connexion.
 */
type EmbeddedSignupData = {
  businessId?: string;
  wabaId?: string;
  phoneNumberId?: string;
};

export default function ConnectButton({ appId, configId, label }: Props) {
  const [sdkReady, setSdkReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.FB)
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [signupData, setSignupData] = useState<EmbeddedSignupData>({});

  // Meta transmet le business_id / waba_id / phone_number_id choisis
  // dans le popup via window.postMessage pendant le flux Embedded
  // Signup (événement "WA_EMBEDDED_SIGNUP", étape "FINISH") — c'est le
  // seul endroit où ces identifiants sont disponibles côté client.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
        return;
      }
      try {
        const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (payload?.type === "WA_EMBEDDED_SIGNUP" && payload?.event === "FINISH") {
          setSignupData({
            businessId: payload.data?.business_id,
            wabaId: payload.data?.waba_id,
            phoneNumberId: payload.data?.phone_number_id,
          });
        }
      } catch {
        // Message non pertinent (pas du JSON Embedded Signup) — ignoré.
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!appId || window.FB) return;

    window.fbAsyncInit = function () {
      window.FB?.init({ appId, autoLogAppEvents: true, xfbml: false, version: "v21.0" });
      setSdkReady(true);
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/fr_FR/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [appId]);

  if (!appId || !configId) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm p-3">
        Configuration Meta manquante : définir{" "}
        <code className="text-xs">NEXT_PUBLIC_META_APP_ID</code> et{" "}
        <code className="text-xs">NEXT_PUBLIC_META_CONFIG_ID</code> (ID de la configuration
        Embedded Signup créée sur Meta for Developers) avant de pouvoir connecter un compte.
      </div>
    );
  }

  function handleClick() {
    if (!window.FB) return;
    setPending(true);
    setMessage(null);

    window.FB.login(
      async (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          setPending(false);
          setMessage("Connexion annulée ou refusée côté Meta.");
          return;
        }
        if (!signupData.businessId) {
          setPending(false);
          setMessage(
            "Code reçu mais identifiant Business Meta manquant (message Embedded Signup non capté) — réessayer la connexion."
          );
          return;
        }
        const result = await exchangeMetaCode(code, signupData.businessId);
        setPending(false);
        setMessage(result.error ?? "Connexion réussie.");
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
      }
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={!sdkReady || pending}
        className="bg-black text-white rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Connexion en cours..." : (label ?? "Connecter mon WhatsApp Business avec Meta")}
      </button>
      {message && <p className="text-xs mt-2 text-black/70">{message}</p>}
    </div>
  );
}
