"use client";

import { useState } from "react";

type Props = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
};
type CartItem = Props & { quantity: number };
type Feedback = "idle" | "added" | "limit";
const KEY = "revant-cart-v1";
const MAX_QUANTITY = 99;

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" && Number.isFinite(item.price) &&
    typeof item.currency === "string" &&
    (typeof item.image === "string" || item.image === null) &&
    Number.isInteger(item.quantity) &&
    (item.quantity as number) > 0 &&
    (item.quantity as number) <= MAX_QUANTITY;
}

export default function AddToCartButton(props: Props) {
  const [feedback, setFeedback] = useState<Feedback>("idle");

  function add() {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      const parsed: CartItem[] = Array.isArray(stored) ? stored.filter(isCartItem) : [];
      const existing = parsed.find((item) => item.id === props.id);
      if (existing && existing.quantity >= MAX_QUANTITY) {
        setFeedback("limit");
        window.setTimeout(() => setFeedback("idle"), 1800);
        return;
      }
      const next = existing
        ? parsed.map((item) => item.id === props.id
            ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + 1) }
            : item)
        : [...parsed, { ...props, quantity: 1 }];
      localStorage.setItem(KEY, JSON.stringify(next));
      setFeedback("added");
      window.setTimeout(() => setFeedback("idle"), 1800);
    } catch {
      setFeedback("idle");
    }
  }

  const label = feedback === "added"
    ? "AJOUTÉ AU PANIER ✓"
    : feedback === "limit"
      ? "LIMITE DE 99 ATTEINTE"
      : "AJOUTER AU PANIER";

  return (
    <button
      type="button"
      onClick={add}
      className="mt-2 block w-full rounded-full border border-neutral-300 py-2.5 text-[10px] font-bold text-neutral-900 transition hover:bg-neutral-100"
      aria-live="polite"
    >
      {label}
    </button>
  );
}
