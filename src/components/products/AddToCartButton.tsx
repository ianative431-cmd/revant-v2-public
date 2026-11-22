"use client";

import { useState } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  shopId?: string;
  shopName?: string | null;
  quantity?: number;
};

export default function AddToCartButton({ item, compact = false }: { item: CartItem; compact?: boolean }) {
  const [added, setAdded] = useState(false);

  function add() {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem("revant-cart") || "[]");
      const existing: CartItem[] = Array.isArray(parsed) ? parsed.filter((candidate): candidate is CartItem =>
        Boolean(candidate) && typeof candidate === "object" &&
        typeof candidate.id === "string" && typeof candidate.name === "string" &&
        typeof candidate.price === "number" && typeof candidate.currency === "string"
      ) : [];
      const index = existing.findIndex((candidate) => candidate.id === item.id);
      if (index >= 0) {
        existing[index] = { ...existing[index], ...item, quantity: Math.min(99, Math.max(1, Number(existing[index].quantity) || 1) + 1) };
      } else {
        existing.push({ ...item, quantity: 1 });
      }
      localStorage.setItem("revant-cart", JSON.stringify(existing));
      window.dispatchEvent(new Event("revant-cart-updated"));
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    } catch {
      setAdded(false);
    }
  }

  return <button type="button" onClick={add} aria-live="polite" className={`revant-cart-action block w-full rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] text-center font-bold text-[var(--brand-text)] transition hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] disabled:cursor-not-allowed ${added ? "revant-cart-added" : ""} ${compact ? "py-2.5 text-[10px]" : "mt-3 px-6 py-4 text-sm"}`}>{added ? "AJOUTÉ AU PANIER ✓" : "AJOUTER AU PANIER"}</button>;
}
