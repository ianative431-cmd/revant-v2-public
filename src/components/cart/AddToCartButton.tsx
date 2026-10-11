"use client";
import { useState } from "react";
type Props = { id: string; name: string; price: number; currency: string; image: string | null };
type CartItem = Props & { quantity: number };
const KEY = "revant-cart-v1";
export default function AddToCartButton(props: Props) {
 const [added, setAdded] = useState(false);
 function add() {
  try {
   const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartItem[];
   const existing = parsed.find((item) => item.id === props.id);
   const next = existing ? parsed.map((item) => item.id === props.id ? { ...item, quantity: item.quantity + 1 } : item) : [...parsed, { ...props, quantity: 1 }];
   localStorage.setItem(KEY, JSON.stringify(next)); setAdded(true); window.setTimeout(() => setAdded(false), 1800);
  } catch { setAdded(false); }
 }
 return <button type="button" onClick={add} className="mt-2 block w-full rounded-full border border-neutral-300 py-2.5 text-[10px] font-bold text-neutral-900 transition hover:bg-neutral-100" aria-live="polite">{added ? "AJOUTÉ AU PANIER ✓" : "AJOUTER AU PANIER"}</button>;
}
