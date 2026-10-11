"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  quantity: number;
};
const KEY = "revant-cart-v1";

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Keep the current page usable even if browser storage is unavailable.
  }
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    try {
      const value = localStorage.getItem(KEY);
      if (value) {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (item): item is CartItem =>
              item !== null &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              typeof item.name === "string" &&
              typeof item.price === "number" &&
              Number.isFinite(item.price) &&
              typeof item.currency === "string" &&
              (typeof item.image === "string" || item.image === null) &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0,
          );
          setItems(valid);
        }
      }
    } catch {
      setItems([]);
    }
  }, []);

  function updateQuantity(id: string, delta: number) {
    const next = items
      .map((item) =>
        item.id === id
          ? { ...item, quantity: Math.min(99, Math.max(0, item.quantity + delta)) }
          : item,
      )
      .filter((item) => item.quantity > 0);
    setItems(next);
    saveCart(next);
  }

  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    saveCart(next);
  }

  function clearCart() {
    setItems([]);
    saveCart([]);
  }

  const totalsByCurrency = items.reduce<Record<string, number>>((totals, item) => {
    totals[item.currency] = (totals[item.currency] ?? 0) + item.price * item.quantity;
    return totals;
  }, {});

  return (
    <main className="mx-auto min-h-[55vh] max-w-3xl px-4 py-8 text-neutral-900">
      <h1 className="text-2xl font-extrabold">Mon panier</h1>
      <p className="mt-1 text-sm text-neutral-500">Les articles sont conservés sur cet appareil.</p>
      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <p className="font-semibold">Votre panier est vide.</p>
          <p className="mt-2 text-sm text-neutral-500">Parcourez le catalogue et ajoutez les produits qui vous intéressent.</p>
          <Link href="/#produits" className="mt-5 inline-flex rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white">Découvrir les produits</Link>
        </div>
      ) : (
        <>
          <div className="mt-6 divide-y rounded-xl border border-neutral-200 bg-white">
            {items.map((item) => (
              <article key={item.id} className="flex items-center gap-3 p-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {item.image && <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm">{item.price.toLocaleString("fr-FR")} {item.currency} × {item.quantity}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-full border border-neutral-300" aria-label={`Quantité de ${item.name}`}>
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} className="min-h-9 min-w-9 rounded-l-full px-3 text-base" aria-label={`Diminuer la quantité de ${item.name}`}>−</button>
                      <span className="min-w-8 text-center text-sm tabular-nums" aria-live="polite">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)} disabled={item.quantity >= 99} className="min-h-9 min-w-9 rounded-r-full px-3 text-base disabled:opacity-40" aria-label={`Augmenter la quantité de ${item.name}`}>+</button>
                    </div>
                    <button type="button" onClick={() => remove(item.id)} className="min-h-9 px-2 text-xs text-red-700 underline">Retirer</button>
                  </div>
                </div>
                <p className="shrink-0 text-right text-sm font-bold">{(item.price * item.quantity).toLocaleString("fr-FR")} {item.currency}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 space-y-2 text-right">
            {Object.entries(totalsByCurrency).map(([currency, total]) => (
              <p key={currency} className="text-lg font-extrabold">Total indicatif : {total.toLocaleString("fr-FR")} {currency}</p>
            ))}
          </div>
          <p className="mt-2 text-right text-xs text-neutral-500">Le paiement multi-articles n’est pas encore connecté. Le total est indicatif et calculé séparément pour chaque devise.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={clearCart} className="rounded-lg border border-neutral-300 px-4 py-3 text-sm font-semibold">Vider le panier</button>
            <Link href="/#produits" className="flex justify-center rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white">Continuer mes achats</Link>
          </div>
        </>
      )}
    </main>
  );
}
