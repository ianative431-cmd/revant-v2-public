"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type CartItem = { id: string; name: string; price: number; currency: string; image: string | null };
export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const refresh = useCallback(() => {
    try { setItems(JSON.parse(localStorage.getItem("revant-cart") || "[]") as CartItem[]); }
    catch { setItems([]); }
  }, []);
  useEffect(() => {
    const initialRefresh = window.setTimeout(refresh, 0);
    window.addEventListener("storage", refresh);
    window.addEventListener("revant-cart-updated", refresh);
    return () => { window.clearTimeout(initialRefresh); window.removeEventListener("storage", refresh); window.removeEventListener("revant-cart-updated", refresh); };
  }, [refresh]);
  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    localStorage.setItem("revant-cart", JSON.stringify(next));
    setItems(next);
  }
  return <main className="min-h-screen bg-[#f7f7f7] px-4 py-8 text-neutral-900"><div className="mx-auto max-w-2xl"><Link href="/" className="text-sm text-neutral-500">← Continuer les achats</Link><h1 className="mt-4 text-2xl font-black">Mon panier</h1>
    {items.length === 0 ? <section className="mt-5 rounded-2xl bg-white p-8 text-center shadow-sm"><p className="font-semibold">Ton panier est vide.</p><p className="mt-2 text-sm text-neutral-500">Ajoute un produit depuis une fiche ou une carte produit.</p><Link href="/#produits" className="mt-5 inline-block rounded-full bg-black px-5 py-3 text-sm font-bold text-white">Découvrir les produits</Link></section> : <div className="mt-5 space-y-3">{items.map((item) => <article key={item.id} className="flex items-center gap-4 rounded-xl bg-white p-3 shadow-sm">{item.image ? <img src={item.image} alt="" className="h-20 w-20 rounded-lg object-cover" /> : <div className="h-20 w-20 rounded-lg bg-neutral-100"/>}<div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold">{item.name}</h2><p className="mt-1 text-sm font-extrabold">{item.price.toLocaleString("fr-FR")} {item.currency}</p><Link href={`/commande/visiteur?productId=${encodeURIComponent(item.id)}`} className="mt-2 inline-block rounded-full bg-black px-3 py-2 text-[10px] font-bold text-white">Commander cet article</Link></div><button type="button" onClick={() => remove(item.id)} className="px-2 py-2 text-xs text-neutral-500 underline">Retirer</button></article>)}</div>}
    <p className="mt-4 text-xs leading-relaxed text-neutral-500">Les commandes sont confirmées article par article pour le moment.</p></div></main>;
}
