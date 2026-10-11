"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type CartItem = { id: string; name: string; price: number; currency: string; image: string | null; quantity: number };
const KEY = "revant-cart-v1";
export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  // Hydrate the browser-only cart after mount; localStorage is unavailable during SSR.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { const value = localStorage.getItem(KEY); if (value) setItems(JSON.parse(value) as CartItem[]); } catch { setItems([]); } }, []);
  function remove(id: string) { const next = items.filter((item) => item.id !== id); setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); }
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <main className="mx-auto min-h-[55vh] max-w-3xl px-4 py-8 text-neutral-900"><h1 className="text-2xl font-extrabold">Mon panier</h1><p className="mt-1 text-sm text-neutral-500">Les articles sont conservés sur cet appareil.</p>{items.length === 0 ? <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-8 text-center"><p className="font-semibold">Votre panier est vide.</p><p className="mt-2 text-sm text-neutral-500">Parcourez le catalogue et ajoutez les produits qui vous intéressent.</p><Link href="/#produits" className="mt-5 inline-flex rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white">Découvrir les produits</Link></div> : <><div className="mt-6 divide-y rounded-xl border border-neutral-200 bg-white">{items.map((item) => <article key={item.id} className="flex items-center gap-3 p-3"><div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">{item.image && <Image src={item.image} alt="" fill sizes="80px" className="object-cover"/>}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.name}</p><p className="mt-1 text-sm">{item.price.toLocaleString("fr-FR")} {item.currency} × {item.quantity}</p><button onClick={() => remove(item.id)} className="mt-2 text-xs text-red-700 underline">Retirer</button></div></article>)}</div><p className="mt-5 text-right text-lg font-extrabold">Total indicatif : {total.toLocaleString("fr-FR")} {items[0]?.currency}</p><p className="mt-2 text-right text-xs text-neutral-500">Le paiement multi-articles n’est pas encore connecté. Pour le moment, vous pouvez consulter et gérer votre sélection ici.</p><Link href="/#produits" className="mt-4 flex justify-center rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white">Continuer mes achats</Link></>}</main>;
}