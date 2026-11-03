"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type CartItem = { id: string; name: string; price: number; currency: string; image: string | null; quantity?: number };
function normalizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CartItem =>
    Boolean(item) && typeof item === "object" &&
    typeof item.id === "string" && typeof item.name === "string" &&
    typeof item.price === "number" && Number.isFinite(item.price) &&
    typeof item.currency === "string"
  ).map((item) => ({
    ...item,
    quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
  }));
}
export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const refresh = useCallback(() => {
    try { setItems(normalizeItems(JSON.parse(localStorage.getItem("revant-cart") || "[]"))); }
    catch { setItems([]); }
  }, []);
  useEffect(() => {
    const initialRefresh = window.setTimeout(refresh, 0);
    window.addEventListener("storage", refresh);
    window.addEventListener("revant-cart-updated", refresh);
    return () => { window.clearTimeout(initialRefresh); window.removeEventListener("storage", refresh); window.removeEventListener("revant-cart-updated", refresh); };
  }, [refresh]);
  function save(next: CartItem[]) {
    localStorage.setItem("revant-cart", JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new Event("revant-cart-updated"));
  }
  function remove(id: string) { save(items.filter((item) => item.id !== id)); }
  function updateQuantity(id: string, quantity: number) {
    const next = items.map((item) => item.id === id
      ? { ...item, quantity: Math.max(1, Math.min(99, Math.floor(quantity))) }
      : item);
    save(next);
  }
  return <main className="min-h-screen bg-brand-bg px-4 py-8 text-brand-text"><div className="mx-auto max-w-2xl"><Link href="/" className="text-sm text-[var(--brand-muted)]">← Continuer les achats</Link><h1 className="mt-4 text-2xl font-black">Mon panier</h1>
    {items.length === 0 ? <section className="mt-5 rounded-2xl bg-[var(--brand-surface)] border border-[var(--brand-border)] p-8 text-center shadow-sm"><p className="font-semibold">Ton panier est vide.</p><p className="mt-2 text-sm text-[var(--brand-muted)]">Ajoute un produit depuis une fiche ou une carte produit.</p><Link href="/#produits" className="mt-5 inline-block rounded-full bg-brand-accent px-5 py-3 text-sm font-bold text-white">Découvrir les produits</Link></section> : <div className="mt-5 space-y-3">{items.map((item) => { const quantity = item.quantity ?? 1; return <article key={item.id} className="flex items-center gap-4 rounded-xl bg-[var(--brand-surface)] border border-[var(--brand-border)] p-3 shadow-sm">{item.image ? <img src={item.image} alt="" className="h-20 w-20 rounded-lg object-cover" /> : <div className="h-20 w-20 rounded-lg bg-[var(--brand-bg)]"/>}<div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold">{item.name}</h2><p className="mt-1 text-sm font-extrabold">{item.price.toLocaleString("fr-FR")} {item.currency}</p><div className="mt-2 flex items-center gap-2"><button type="button" aria-label={`Diminuer la quantité de ${item.name}`} onClick={() => updateQuantity(item.id, quantity - 1)} disabled={quantity <= 1} className="h-8 w-8 rounded-full border border-[var(--brand-border)] disabled:opacity-40">−</button><span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">{quantity}</span><button type="button" aria-label={`Augmenter la quantité de ${item.name}`} onClick={() => updateQuantity(item.id, quantity + 1)} disabled={quantity >= 99} className="h-8 w-8 rounded-full border border-[var(--brand-border)] disabled:opacity-40">+</button><button type="button" onClick={() => remove(item.id)} className="ml-2 text-xs text-[var(--brand-muted)] underline">Retirer</button></div><Link href={`/commande/visiteur?productId=${encodeURIComponent(item.id)}&quantity=${quantity}`} className="mt-3 inline-block rounded-full bg-brand-accent px-3 py-2 text-[10px] font-bold text-white">Commander cet article</Link></div></article>; })}</div>}
    <p className="mt-4 text-xs leading-relaxed text-[var(--brand-muted)]">Les commandes restent confirmées article par article. La quantité est vérifiée côté serveur avant la création de la commande.</p></div></main>;
}
