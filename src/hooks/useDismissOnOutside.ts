"use client";

import { useEffect, type RefObject } from "react";

/**
 * Reusable dismissal behavior for custom floating panels and popovers.
 * The pointer event is captured so the outside control still receives its tap.
 */
export function useDismissOnOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onDismiss: () => void,
  enabled = true,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!enabled) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node) || !ref.current?.contains(target)) {
        onDismiss();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        (onEscape ?? onDismiss)();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onDismiss, onEscape, ref]);
}
