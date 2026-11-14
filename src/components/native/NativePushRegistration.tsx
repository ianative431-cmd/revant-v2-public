"use client";

import { useEffect } from "react";

const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export default function NativePushRegistration() {
  useEffect(() => {
    let disposed = false;
    let lastSubmittedToken: string | null = null;

    async function registerToken(token: string) {
      if (disposed || !TOKEN_PATTERN.test(token) || token === lastSubmittedToken) return;
      lastSubmittedToken = token;

      try {
        const response = await fetch("/api/native/push-token", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) lastSubmittedToken = null;
      } catch {
        lastSubmittedToken = null;
      }
    }

    const onPushToken = (event: Event) => {
      const token = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (typeof token === "string") void registerToken(token);
    };

    window.addEventListener("revant:push-token", onPushToken);
    if (typeof window.__revantAPNSToken === "string") {
      void registerToken(window.__revantAPNSToken);
    }

    return () => {
      disposed = true;
      window.removeEventListener("revant:push-token", onPushToken);
    };
  }, []);

  return null;
}
