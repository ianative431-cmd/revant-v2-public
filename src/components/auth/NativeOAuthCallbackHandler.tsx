"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const CALLBACK_SCHEME = "ne.revant.marketplace:";
function safeDestination(value: string | null): "/compte" | "/compte/boutique" {
  return value === "/compte/boutique" ? "/compte/boutique" : "/compte";
}

function localAuthError(reason: "callback" | "exchange") {
  const url = new URL("/auth/erreur", window.location.origin);
  url.searchParams.set("flow", "seller");
  url.searchParams.set("reason", reason);
  window.location.replace(url.toString());
}

/**
 * Handles the native Capacitor deep-link return in the SAME WebView that
 * initiated Supabase PKCE. The external Custom Tab must never exchange the
 * code because its cookie jar does not contain the WebView's PKCE verifier.
 */
export default function NativeOAuthCallbackHandler() {
  const handledUrls = useRef(new Set<string>());

  useEffect(() => {
    let disposed = false;
    let appUrlListener: { remove: () => Promise<void> } | undefined;

    async function handleCallback(rawUrl: string) {
      if (disposed || handledUrls.current.has(rawUrl)) return;

      let callback: URL;
      try {
        callback = new URL(rawUrl);
      } catch {
        return;
      }

      if (
        callback.protocol !== CALLBACK_SCHEME ||
        callback.hostname !== "auth" ||
        callback.pathname !== "/callback"
      ) {
        return;
      }

      handledUrls.current.add(rawUrl);
      const destination = safeDestination(callback.searchParams.get("next"));
      const error = callback.searchParams.get("error");
      const code = callback.searchParams.get("code");

      if (error || !code) {
        localAuthError("callback");
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          localAuthError("exchange");
          return;
        }

        const { Browser } = await import("@capacitor/browser");
        await Browser.close().catch(() => undefined);

        const completeUrl = new URL("/auth/callback", window.location.origin);
        completeUrl.searchParams.set("native", "1");
        completeUrl.searchParams.set("next", destination);
        window.location.replace(completeUrl.toString());
      } catch {
        localAuthError("exchange");
      }
    }

    async function initialize() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");
      appUrlListener = await App.addListener("appUrlOpen", ({ url }) => {
        void handleCallback(url);
      });

      const launch = await App.getLaunchUrl();
      if (launch?.url) {
        void handleCallback(launch.url);
      }
    }

    void initialize().catch(() => undefined);

    return () => {
      disposed = true;
      void appUrlListener?.remove();
    };
  }, []);

  return null;
}
