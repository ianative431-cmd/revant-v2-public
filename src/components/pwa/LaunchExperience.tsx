"use client";

import { useEffect, useState } from "react";

type LaunchStage = "logo" | "video" | null;

const VIDEO_SRC = "/media/revant-launch.mp4";
const LAUNCH_KEY = "revant-launch-experience-shown";

export default function LaunchExperience() {
  const [stage, setStage] = useState<LaunchStage>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const launchedFromPwa = new URLSearchParams(window.location.search).get("source") === "pwa";

    if (!isStandalone && !launchedFromPwa) return;

    try {
      if (window.sessionStorage.getItem(LAUNCH_KEY) === "1") return;
      window.sessionStorage.setItem(LAUNCH_KEY, "1");
    } catch {
      // Storage may be unavailable in a restricted browser context; continue safely.
    }

    setStage("logo");
    const logoTimer = window.setTimeout(() => setStage("video"), 650);
    const safetyTimer = window.setTimeout(() => setStage(null), 9_000);

    return () => {
      window.clearTimeout(logoTimer);
      window.clearTimeout(safetyTimer);
    };
  }, []);

  if (!stage) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#a79986]"
      role="status"
      aria-label="Bienvenue sur Revant"
    >
      {stage === "logo" ? (
        <img
          src="/images/logo-revant-app-512.png"
          alt="Revant"
          className="h-28 w-28 animate-[revant-logo-in_500ms_ease-out_both] object-contain"
        />
      ) : (
        <video
          key="revant-launch-video"
          src={VIDEO_SRC}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={() => setStage(null)}
          onError={() => setStage(null)}
          onCanPlay={(event) => {
            void event.currentTarget.play().catch(() => setStage(null));
          }}
          className="h-full w-full object-contain"
          aria-label="Animation de lancement Revant"
        />
      )}
      <style jsx>{`
        @keyframes revant-logo-in {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
