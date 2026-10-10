"use client";

import { useEffect, useState } from "react";
import { BUILD_VERSION } from "@/generated/build-version";

export default function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;

    const checkDeploymentVersion = async () => {
      try {
        const response = await fetch("/api/version", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        if (
          !disposed &&
          typeof payload === "object" &&
          payload !== null &&
          "version" in payload &&
          typeof payload.version === "string" &&
          payload.version !== BUILD_VERSION
        ) {
          setUpdateAvailable(true);
        }
      } catch {
        // A temporary offline/network error should not interrupt shopping.
      }
    };

    const registerWorker = async () => {
      if (!("serviceWorker" in navigator)) return;
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        await registration.update();
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Revant: impossible d’enregistrer le service worker.", error);
        }
      }
    };

    void registerWorker();
    void checkDeploymentVersion();
    const pollTimer = setInterval(() => void checkDeploymentVersion(), 60_000);

    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void checkDeploymentVersion();
        void registration?.update().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", checkWhenVisible);
    window.addEventListener("focus", checkWhenVisible);

    return () => {
      disposed = true;
      clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", checkWhenVisible);
      window.removeEventListener("focus", checkWhenVisible);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-white/20 bg-[#1f1d20] px-4 py-3 text-sm text-white shadow-2xl"
    >
      <span>Une nouvelle version de Revant est disponible.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 rounded-xl bg-white px-3 py-2 font-semibold text-[#1f1d20]"
      >
        Actualiser
      </button>
    </div>
  );
}
