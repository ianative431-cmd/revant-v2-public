"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  nextPath?: "/compte" | "/compte/boutique" | "/admin";
  variant?: "light" | "dark";
};

/**
 * Google OAuth uses Supabase Auth + PKCE. The callback performs the
 * server-side code exchange; /admin is protected again by a database role check.
 */
export default function GoogleSignInButton({ nextPath = "/compte", variant = "light" }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", nextPath);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError) {
        setError("La connexion Google n'a pas pu démarrer. Vérifie la configuration Google dans Supabase.");
        setPending(false);
      }
    } catch {
      setError("Connexion Google indisponible. Réessaie dans quelques instants.");
      setPending(false);
    }
  }

  const buttonClass = variant === "dark"
    ? "w-full rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-[#0B0B10] disabled:opacity-50"
    : "w-full rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm disabled:opacity-50";

  return (
    <div>
      <button type="button" onClick={signIn} disabled={pending} className={buttonClass}>
        <span className="inline-flex items-center justify-center gap-3">
          <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.05 13.22l7.98 6.19C11.95 13.72 17.48 9.5 24 9.5Z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.95 46.98 31.8 46.98 24.55Z" />
            <path fill="#FBBC05" d="M10.03 28.59A14.4 14.4 0 0 1 9.25 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.47-6.19Z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.88 2.3-8.18 2.3-6.52 0-12.05-4.22-14.03-10.09l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
          </svg>
          {pending ? "Redirection vers Google…" : "Continuer avec Google"}
        </span>
      </button>
      {error && <p role="alert" className={variant === "dark" ? "mt-3 text-center text-xs text-red-200" : "mt-3 text-center text-xs text-red-600"}>{error}</p>}
    </div>
  );
}
