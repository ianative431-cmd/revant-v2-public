"use client";

import { useEffect } from "react";

/**
 * Gives every native <details> menu the same predictable dismissal behavior:
 * tap/click anywhere outside it, or press Escape.
 */
export default function GlobalDismissibleDetails() {
  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;

      document.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => {
        if (target instanceof Node && details.contains(target)) return;
        details.open = false;
      });
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      const openDetails = Array.from(
        document.querySelectorAll<HTMLDetailsElement>("details[open]"),
      );

      openDetails.forEach((details) => {
        details.open = false;
      });

      openDetails.at(-1)?.querySelector<HTMLElement>("summary")?.focus();
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return null;
}
