"use client";

import { useEffect } from "react";

type Preferences = {
  motion?: "ultra" | "reduced";
  glass?: "subtle" | "balanced" | "strong";
  text?: "normal" | "large";
};

const STORAGE_KEY = "revant-display-preferences-v1";

export default function DisplayPreferencesBootstrap() {
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Preferences;
      const root = document.documentElement;
      root.dataset.revantMotion = parsed.motion === "reduced" ? "reduced" : "ultra";
      root.dataset.revantGlass = parsed.glass === "balanced" || parsed.glass === "strong" ? parsed.glass : "subtle";
      root.dataset.revantText = parsed.text === "large" ? "large" : "normal";
    } catch {
      document.documentElement.dataset.revantMotion = "ultra";
      document.documentElement.dataset.revantGlass = "subtle";
      document.documentElement.dataset.revantText = "normal";
    }
  }, []);

  return null;
}
