"use client";

import { useEffect } from "react";

const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

type LiveActivityTokenPayload = {
  token?: string;
  activityId?: string;
  orderReference?: string;
};

export default function NativePushRegistration() {
  useEffect(() => {
    let disposed = false;
    let lastSubmittedToken: string | null = null;
    const submittedActivityTokens = new Set<string>();

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

    async function registerLiveActivityToken(payload: LiveActivityTokenPayload) {
      const { token, activityId, orderReference } = payload;
      if (
        disposed ||
        typeof token !== "string" ||
        !TOKEN_PATTERN.test(token) ||
        typeof activityId !== "string" ||
        activityId.length < 1 ||
        activityId.length > 128 ||
        typeof orderReference !== "string" ||
        orderReference.length < 1 ||
        orderReference.length > 80 ||
        submittedActivityTokens.has(activityId)
      ) return;

      submittedActivityTokens.add(activityId);
      try {
        const response = await fetch("/api/native/live-activity-token", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, activityId, orderReference }),
        });
        if (!response.ok) submittedActivityTokens.delete(activityId);
      } catch {
        submittedActivityTokens.delete(activityId);
      }
    }

    const onPushToken = (event: Event) => {
      const token = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (typeof token === "string") void registerToken(token);
    };
    const onLiveActivityToken = (event: Event) => {
      const payload = (event as CustomEvent<LiveActivityTokenPayload>).detail;
      if (payload) void registerLiveActivityToken(payload);
    };

    window.addEventListener("revant:push-token", onPushToken);
    window.addEventListener("revant:live-activity-token", onLiveActivityToken);
    if (typeof window.__revantAPNSToken === "string") {
      void registerToken(window.__revantAPNSToken);
    }

    return () => {
      disposed = true;
      window.removeEventListener("revant:push-token", onPushToken);
      window.removeEventListener("revant:live-activity-token", onLiveActivityToken);
    };
  }, []);

  return null;
}
